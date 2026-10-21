import { openDB, type IDBPDatabase } from 'idb'
import { COLLECTIONS, emptyDB, type Collection, type DB } from '../lib/types'

export type Rec<C extends Collection> = DB[C][number]
/** Storage boundary: the UI talks to Store, Store talks to a Repo (IndexedDB now; a cloud repo could slot in later). */
export interface Repo {
  loadAll(): Promise<DB>
  put<C extends Collection>(c: C, records: Rec<C>[]): Promise<void>
  delete(c: Collection, ids: string[]): Promise<void>
}

export class IdbRepo implements Repo {
  private dbp: Promise<IDBPDatabase>
  constructor(name = 'stock-desk') {
    this.dbp = openDB(name, 1, { upgrade(db) { for (const c of COLLECTIONS) if (!db.objectStoreNames.contains(c)) db.createObjectStore(c, { keyPath: 'id' }) } })
  }
  async loadAll() {
    const db = await this.dbp; const out = emptyDB(); const tx = db.transaction(COLLECTIONS, 'readonly')
    await Promise.all(COLLECTIONS.map(async (c) => { (out[c] as unknown[]) = await tx.objectStore(c).getAll() }))
    return out
  }
  async put<C extends Collection>(c: C, rs: Rec<C>[]) { if (!rs.length) return; const tx = (await this.dbp).transaction(c, 'readwrite'); await Promise.all([...rs.map((r) => tx.store.put(r)), tx.done]) }
  async delete(c: Collection, ids: string[]) { if (!ids.length) return; const tx = (await this.dbp).transaction(c, 'readwrite'); await Promise.all([...ids.map((i) => tx.store.delete(i)), tx.done]) }
}

export class MemoryRepo implements Repo {
  db = emptyDB()
  async loadAll() { return structuredClone(this.db) }
  async put<C extends Collection>(c: C, rs: Rec<C>[]) { const l = this.db[c] as Rec<C>[]; for (const r of rs) { const i = l.findIndex((x) => x.id === r.id); if (i >= 0) l[i] = structuredClone(r); else l.push(structuredClone(r)) } }
  async delete(c: Collection, ids: string[]) { (this.db[c] as { id: string }[]) = (this.db[c] as { id: string }[]).filter((x) => !ids.includes(x.id)) }
}
