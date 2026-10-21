import { useState } from 'react'
import { today, useDB, useStore } from '../data/store'
import { allocateLanded, money, money0 } from '../lib/calc'
import type { Container } from '../lib/types'
import { Empty, Field, num, Sheet } from '../ui'

type Row = { productId: string; qty: string; unitCost: string }

function Edit({ c, onClose }: { c: Partial<Container>; onClose: () => void }) {
  const db = useDB(); const s = useStore()
  const [ref, setRef] = useState(c.ref ?? ''); const [date, setDate] = useState(c.date ?? today())
  const [freight, setFreight] = useState(String(c.freight ?? '')); const [duty, setDuty] = useState(String(c.duty ?? ''))
  const [rows, setRows] = useState<Row[]>(c.items?.map((i) => ({ productId: i.productId, qty: String(i.qty), unitCost: String(i.unitCost) })) ?? [{ productId: '', qty: '', unitCost: '' }])
  const items = rows.map((r) => ({ productId: r.productId, qty: Math.floor(num(r.qty)), unitCost: num(r.unitCost) }))
  const alloc = allocateLanded(items.filter((i) => i.productId && i.qty > 0), num(freight), num(duty))
  const goods = items.reduce((a, i) => a + i.qty * i.unitCost, 0)
  const upd = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => {
    if (j !== i) return r
    const n = { ...r, [k]: v }
    if (k === 'productId' && !r.unitCost) n.unitCost = String(db.products.find((p) => p.id === v)?.cost ?? '')
    return n
  }))
  const save = async () => { await s.saveContainer({ id: c.id, demo: c.demo, ref: ref.trim() || 'Container', date, freight: num(freight), duty: num(duty), items }); onClose() }
  return (
    <Sheet title={c.id ? 'Edit container' : 'Container arrival'} onClose={onClose}>
      <div className="grid2 form">
        <Field label="Container / ref"><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="MSKU 1234567" /></Field>
        <Field label="Arrived"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Freight $"><input inputMode="decimal" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0" /></Field>
        <Field label="Duty $"><input inputMode="decimal" value={duty} onChange={(e) => setDuty(e.target.value)} placeholder="0" /></Field>
      </div>
      <h3 className="sec">Items</h3>
      {rows.map((r, i) => {
        const a = alloc.find((x) => x.productId === r.productId && x.qty === Math.floor(num(r.qty)))
        return (
          <div className="card item" key={i}>
            <select value={r.productId} onChange={(e) => upd(i, 'productId', e.target.value)} aria-label="Product">
              <option value="">Choose product…</option>
              {db.products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <div className="grid3">
              <Field label="Qty"><input inputMode="numeric" value={r.qty} onChange={(e) => upd(i, 'qty', e.target.value)} /></Field>
              <Field label="Cost / unit"><input inputMode="decimal" value={r.unitCost} onChange={(e) => upd(i, 'unitCost', e.target.value)} /></Field>
              <div className="field"><span>Landed</span><div className="landed">{a?.landed != null ? money(a.landed) : '—'}</div></div>
            </div>
            {rows.length > 1 && <button className="link danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        )
      })}
      <button className="btn ghost block" onClick={() => setRows([...rows, { productId: '', qty: '', unitCost: '' }])}>＋ Add item</button>
      <div className="totals"><span>Goods {money0(goods)}</span><span>+ Freight & duty {money0(num(freight) + num(duty))}</span><b>Landed {money0(goods + num(freight) + num(duty))}</b></div>
      <p className="muted small">Freight and duty are spread across items by value to give each a landed unit cost.</p>
      <button className="btn primary big block" disabled={!alloc.length} onClick={save}>{c.id ? 'Save changes' : `Receive ${alloc.reduce((a, i) => a + i.qty, 0)} units`}</button>
      {c.id && <button className="btn danger block" onClick={async () => { if (confirm('Delete container and remove its stock?')) { await s.deleteContainer(c.id!); onClose() } }}>Delete container</button>}
    </Sheet>
  )
}

export default function Containers() {
  const db = useDB()
  const [edit, setEdit] = useState<Partial<Container> | null>(null)
  const list = [...db.containers].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="screen">
      <div className="head-row"><h1>Containers</h1><button className="btn primary" disabled={!db.products.length} onClick={() => setEdit({})}>＋ Arrival</button></div>
      {!list.length ? <Empty icon="🚢" title="No containers logged"><p>{db.products.length ? 'Log an arrival with items, freight and duty — stock is added at landed cost.' : 'Add products first, then log container arrivals.'}</p>
        {db.products.length > 0 && <button className="btn primary big" onClick={() => setEdit({})}>Log arrival</button>}</Empty> : (
        <div className="cards">{list.map((c) => {
          const goods = c.items.reduce((a, i) => a + i.qty * i.unitCost, 0); const units = c.items.reduce((a, i) => a + i.qty, 0)
          return (
            <button className="card cont tap" key={c.id} onClick={() => setEdit(c)} data-testid="container-card">
              <div className="row0"><b>{c.ref}</b><span className="muted">{c.date}</span></div>
              <div className="chips"><span>{units.toLocaleString()} units</span><span>{c.items.length} SKUs</span><span>Freight {money0(c.freight)}</span><span>Duty {money0(c.duty)}</span></div>
              <div className="landed-total">Landed total <b>{money0(goods + c.freight + c.duty)}</b></div>
            </button>
          )
        })}</div>
      )}
      {edit && <Edit c={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
