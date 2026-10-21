import { createContext, useContext, useSyncExternalStore } from 'react'
import { allocateLanded, avgCost, r2 } from '../lib/calc'
import { emptyDB, type Collection, type Container, type ContainerItem, type DB, type MoveType } from '../lib/types'
import type { Rec, Repo } from './repo'

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36))
export const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
type New<C extends Collection> = Omit<Rec<C>, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

export class Store {
  db: DB = emptyDB()
  private subs = new Set<() => void>()
  private repo: Repo
  constructor(repo: Repo) { this.repo = repo }
  async init() { this.db = await this.repo.loadAll(); this.emit() }
  subscribe = (f: () => void) => { this.subs.add(f); return () => { this.subs.delete(f) } }
  getSnapshot = () => this.db
  private emit() { this.db = { ...this.db }; this.subs.forEach((f) => f()) }

  async save<C extends Collection>(c: C, items: New<C>[]) {
    const now = new Date().toISOString()
    const list = [...this.db[c]] as Rec<C>[]
    const out = items.map((it) => {
      const old = it.id ? list.find((x) => x.id === it.id) : undefined
      const rec = { ...old, ...it, id: it.id ?? uid(), createdAt: old?.createdAt ?? now, updatedAt: now } as Rec<C>
      const i = list.findIndex((x) => x.id === rec.id); if (i >= 0) list[i] = rec; else list.push(rec)
      return rec
    })
    await this.repo.put(c, out); (this.db[c] as Rec<C>[]) = list; this.emit(); return out
  }
  async remove(c: Collection, ids: string[]) {
    await this.repo.delete(c, ids); (this.db[c] as { id: string }[]) = (this.db[c] as { id: string }[]).filter((x) => !ids.includes(x.id)); this.emit()
  }

  /** Stock in / out from the Scan screen. Outs record COGS at current average landed cost. */
  async move(productId: string, type: MoveType, qty: number, opts: { unitPrice?: number; retailer?: string; date?: string; demo?: boolean } = {}) {
    const p = this.db.products.find((x) => x.id === productId); if (!p) throw new Error('Unknown product')
    const unitCost = avgCost(this.db.movements, p)
    return this.save('movements', [{ productId, type, qty, unitCost, unitPrice: type === 'out' ? (opts.unitPrice ?? p.price) : 0, retailer: opts.retailer?.trim() ?? '', date: opts.date ?? today(), demo: opts.demo }])
  }

  /** Log a container: allocate freight+duty by value -> landed cost, add stock. Re-saving replaces its stock movements. */
  async saveContainer(c: { id?: string; ref: string; date: string; freight: number; duty: number; items: ContainerItem[]; demo?: boolean }) {
    const items = allocateLanded(c.items.filter((i) => i.productId && i.qty > 0), c.freight, c.duty)
    const [rec] = await this.save('containers', [{ ...c, items }]) as Container[]
    await this.remove('movements', this.db.movements.filter((m) => m.containerId === rec.id).map((m) => m.id))
    await this.save('movements', items.map((i) => ({ productId: i.productId, type: 'in' as const, qty: i.qty, unitCost: r2(i.landed!), unitPrice: 0, retailer: '', date: c.date, containerId: rec.id, demo: c.demo })))
    return rec
  }
  async deleteContainer(id: string) {
    await this.remove('movements', this.db.movements.filter((m) => m.containerId === id).map((m) => m.id)); await this.remove('containers', [id])
  }
  async deleteProduct(id: string) {
    await this.remove('movements', this.db.movements.filter((m) => m.productId === id).map((m) => m.id)); await this.remove('products', [id])
  }
  async clearDemo() {
    for (const c of ['movements', 'containers', 'products'] as const) await this.remove(c, (this.db[c] as { id: string; demo?: boolean }[]).filter((x) => x.demo).map((x) => x.id))
  }
}

export const StoreCtx = createContext<Store>(null!)
export const useStore = () => useContext(StoreCtx)
export const useDB = () => { const s = useStore(); return useSyncExternalStore(s.subscribe, s.getSnapshot) }
