import type { ContainerItem, DB, Movement, Product } from './types'

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US')
export const pct = (n: number) => (isFinite(n) ? (n * 100).toFixed(1) + '%' : '—')

export function onHand(moves: Movement[], productId: string) {
  let q = 0
  for (const m of moves) if (m.productId === productId) q += m.type === 'in' ? m.qty : -m.qty
  return q
}

/** Weighted-average landed cost per unit across all stock received; falls back to product cost. */
export function avgCost(moves: Movement[], p: Product) {
  let q = 0, v = 0
  for (const m of moves) if (m.productId === p.id && m.type === 'in') { q += m.qty; v += m.qty * m.unitCost }
  return q > 0 ? r2(v / q) : p.cost
}

/** Allocate freight + duty across items in proportion to item value (qty × cost). Returns landed unit cost per item. */
export function allocateLanded(items: ContainerItem[], freight: number, duty: number): ContainerItem[] {
  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0)
  const extra = (freight || 0) + (duty || 0)
  return items.map((i) => {
    const value = i.qty * i.unitCost
    const share = total > 0 ? value / total : items.length ? 1 / items.length : 0
    const landed = i.qty > 0 ? (value + extra * share) / i.qty : i.unitCost
    return { ...i, landed: Math.round(landed * 10000) / 10000 }
  })
}

export interface Line { revenue: number; cogs: number; profit: number; units: number; margin: number }
export const line = (moves: Movement[]): Line => {
  let revenue = 0, cogs = 0, units = 0
  for (const m of moves) if (m.type === 'out') { revenue += m.qty * m.unitPrice; cogs += m.qty * m.unitCost; units += m.qty }
  const profit = revenue - cogs
  return { revenue: r2(revenue), cogs: r2(cogs), profit: r2(profit), units, margin: revenue ? profit / revenue : NaN }
}

export function productRows(db: DB) {
  return db.products.map((p) => {
    const qty = onHand(db.movements, p.id)
    const cost = avgCost(db.movements, p)
    return { p, qty, cost, value: r2(Math.max(qty, 0) * cost), low: qty <= p.reorder }
  }).sort((a, b) => a.p.sku.localeCompare(b.p.sku))
}

export function dashboard(db: DB) {
  const rows = productRows(db)
  const s = line(db.movements)
  return {
    ...s,
    soldUnits: s.units,
    units: rows.reduce((a, r) => a + r.qty, 0),
    value: r2(rows.reduce((a, r) => a + r.value, 0)),
    low: rows.filter((r) => r.low),
  }
}

export function byRetailer(moves: Movement[]) {
  const m = new Map<string, Movement[]>()
  for (const x of moves) if (x.type === 'out') { const k = x.retailer || '(none)'; m.set(k, [...(m.get(k) ?? []), x]) }
  return [...m].map(([name, ms]) => ({ name, ...line(ms) })).sort((a, b) => b.revenue - a.revenue)
}

const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export const toCSV = (rows: unknown[][]) => rows.map((r) => r.map(esc).join(',')).join('\r\n')

export function productsCSV(db: DB) {
  return toCSV([['sku', 'name', 'cost', 'price', 'reorder_level', 'on_hand', 'avg_landed_cost', 'stock_value'],
    ...productRows(db).map(({ p, qty, cost, value }) => [p.sku, p.name, p.cost, p.price, p.reorder, qty, cost, value])])
}
export function movementsCSV(db: DB) {
  const P = new Map(db.products.map((p) => [p.id, p]))
  const C = new Map(db.containers.map((c) => [c.id, c.ref]))
  return toCSV([['date', 'type', 'sku', 'name', 'qty', 'unit_cost', 'unit_price', 'revenue', 'profit', 'retailer', 'container'],
    ...[...db.movements].sort((a, b) => a.date.localeCompare(b.date)).map((m) => {
      const p = P.get(m.productId)
      const rev = m.type === 'out' ? r2(m.qty * m.unitPrice) : ''
      return [m.date, m.type, p?.sku, p?.name, m.qty, m.unitCost, m.type === 'out' ? m.unitPrice : '', rev, m.type === 'out' ? r2(m.qty * (m.unitPrice - m.unitCost)) : '', m.retailer, m.containerId ? C.get(m.containerId) : '']
    })])
}
