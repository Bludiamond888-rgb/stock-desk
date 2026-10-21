import { describe, expect, it } from 'vitest'
import { allocateLanded, avgCost, byRetailer, dashboard, line, onHand, productsCSV, movementsCSV } from './calc'
import type { DB, Movement, Product } from './types'

const t = '2026-01-01T00:00:00Z'
const P = (id: string, cost: number, price: number, reorder = 5): Product => ({ id, sku: id.toUpperCase(), name: 'N ' + id, cost, price, reorder, createdAt: t, updatedAt: t })
let n = 0
const M = (productId: string, type: 'in' | 'out', qty: number, unitCost: number, unitPrice = 0, retailer = ''): Movement =>
  ({ id: String(n++), productId, type, qty, unitCost, unitPrice, retailer, date: '2026-01-02', createdAt: t, updatedAt: t })

describe('calc', () => {
  it('on-hand = ins - outs', () => {
    const ms = [M('a', 'in', 10, 1), M('a', 'out', 3, 1), M('b', 'in', 4, 1), M('a', 'in', 2, 1)]
    expect(onHand(ms, 'a')).toBe(9); expect(onHand(ms, 'b')).toBe(4); expect(onHand(ms, 'z')).toBe(0)
  })
  it('allocates freight+duty by value', () => {
    const r = allocateLanded([{ productId: 'a', qty: 100, unitCost: 2 }, { productId: 'b', qty: 50, unitCost: 12 }], 600, 200)
    // values 200 & 600 (total 800); extra 800 -> 200 & 600
    expect(r[0].landed).toBe(4); expect(r[1].landed).toBe(24)
    const total = r.reduce((s, i) => s + i.qty * i.landed!, 0)
    expect(total).toBeCloseTo(800 + 800)
  })
  it('handles zero-value containers', () => {
    const r = allocateLanded([{ productId: 'a', qty: 10, unitCost: 0 }, { productId: 'b', qty: 10, unitCost: 0 }], 100, 0)
    expect(r[0].landed).toBe(5)
  })
  it('weighted average landed cost, fallback to product cost', () => {
    const p = P('a', 3, 9)
    expect(avgCost([], p)).toBe(3)
    expect(avgCost([M('a', 'in', 10, 4), M('a', 'in', 30, 6)], p)).toBe(5.5)
  })
  it('profit, margin and by-retailer', () => {
    const ms = [M('a', 'in', 10, 4), M('a', 'out', 2, 4, 10, 'Shop A'), M('a', 'out', 3, 4, 8, 'Shop B'), M('a', 'out', 1, 4, 10, 'Shop A')]
    const l = line(ms)
    expect(l.revenue).toBe(54); expect(l.cogs).toBe(24); expect(l.profit).toBe(30); expect(l.margin).toBeCloseTo(30 / 54)
    const r = byRetailer(ms)
    expect(r[0]).toMatchObject({ name: 'Shop A', revenue: 30, profit: 18, units: 3 })
    expect(r[1]).toMatchObject({ name: 'Shop B', revenue: 24, profit: 12 })
  })
  it('dashboard + low stock + CSV', () => {
    const db: DB = { products: [P('a', 4, 10, 5), P('b', 1, 2, 0)], movements: [M('a', 'in', 10, 4), M('a', 'out', 6, 4, 10, 'X, Inc'), M('b', 'in', 3, 1)], containers: [] }
    const d = dashboard(db)
    expect(d.units).toBe(7); expect(d.value).toBe(19); expect(d.profit).toBe(36)
    expect(d.low.map((r) => r.p.id)).toEqual(['a'])
    expect(productsCSV(db).split('\r\n')[1]).toBe('A,N a,4,10,5,4,4,16')
    expect(movementsCSV(db)).toContain('"X, Inc"')
  })
})
