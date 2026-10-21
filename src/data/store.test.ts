import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { IdbRepo, MemoryRepo } from './repo'
import { Store } from './store'
import { dashboard, onHand } from '../lib/calc'
import { loadDemo } from '../lib/demo'

describe('store', () => {
  it('container -> landed cost stock; sale uses avg cost; persists in IndexedDB', async () => {
    const repo = new IdbRepo('t-' + Math.random()); const s = new Store(repo); await s.init()
    const [a] = await s.save('products', [{ sku: 'A', name: 'A', cost: 2, price: 10, reorder: 5 }])
    const c = await s.saveContainer({ ref: 'C1', date: '2026-01-01', freight: 100, duty: 100, items: [{ productId: a.id, qty: 100, unitCost: 2 }] })
    expect(s.db.movements[0].unitCost).toBe(4)
    await s.move(a.id, 'out', 10)
    const s2 = new Store(repo); await s2.init()
    expect(onHand(s2.db.movements, a.id)).toBe(90)
    expect(dashboard(s2.db).profit).toBe(60)
    await s2.saveContainer({ ...c, freight: 0, duty: 0 }) // re-save replaces stock, not doubles
    expect(onHand(s2.db.movements, a.id)).toBe(90)
  })
  it('demo loads and clears cleanly', async () => {
    const s = new Store(new MemoryRepo()); await s.init()
    await s.save('products', [{ sku: 'REAL', name: 'Real', cost: 1, price: 2, reorder: 0 }])
    await loadDemo(s)
    const d = dashboard(s.db)
    expect(d.revenue).toBeGreaterThan(0); expect(d.units).toBeGreaterThan(0); expect(d.low.length).toBeGreaterThan(0)
    expect(s.db.products.every((p) => onHand(s.db.movements, p.id) >= 0)).toBe(true)
    await s.clearDemo()
    expect(s.db.products.map((p) => p.sku)).toEqual(['REAL']); expect(s.db.movements).toHaveLength(0)
  })
})
