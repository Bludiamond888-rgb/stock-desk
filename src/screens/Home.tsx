import { useState } from 'react'
import { useDB, useStore } from '../data/store'
import { dashboard, money0, movementsCSV, pct, productsCSV } from '../lib/calc'
import { loadDemo } from '../lib/demo'
import { download, Empty } from '../ui'

export default function Home() {
  const db = useDB(); const s = useStore(); const d = dashboard(db)
  const [busy, setBusy] = useState(false)
  const hasDemo = db.products.some((p) => p.demo)
  const hour = new Date().getHours()
  const run = async (f: () => Promise<void>) => { setBusy(true); try { await f() } finally { setBusy(false) } }
  return (
    <div className="screen">
      <p className="hello">Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, Chairman</p>
      {!db.products.length ? (
        <Empty icon="📦" title="Your warehouse is empty">
          <p>Add products, log a container arrival, then scan stock in and out.</p>
          <a className="btn primary big" href="#/products">Add first product</a>
          <button className="btn ghost big" disabled={busy} onClick={() => run(() => loadDemo(s))}>Load demo data</button>
        </Empty>
      ) : (
        <>
          <div className="hero card grad">
            <span>Stock value at cost</span>
            <strong data-testid="stock-value">{money0(d.value)}</strong>
            <small>{d.units.toLocaleString()} units on hand · {db.products.length} products</small>
          </div>
          <div className="kpis">
            <div className="card kpi"><span>Sales</span><strong>{money0(d.revenue)}</strong></div>
            <div className="card kpi"><span>Gross profit</span><strong className="pos">{money0(d.profit)}</strong></div>
            <div className="card kpi"><span>Margin</span><strong>{pct(d.margin)}</strong></div>
            <div className="card kpi"><span>Units sold</span><strong>{d.soldUnits.toLocaleString()}</strong></div>
          </div>
          <a className="btn primary big block" href="#/scan">⌁ Scan stock in / out</a>
          <h3 className="sec">Low stock {d.low.length > 0 && <span className="pill warn">{d.low.length}</span>}</h3>
          {d.low.length ? (
            <div className="card list">
              {d.low.map(({ p, qty }) => (
                <div className="row" key={p.id} data-testid="low-row">
                  <div className="grow"><b>{p.name}</b><small>{p.sku} · reorder at {p.reorder}</small></div>
                  <span className={'qty ' + (qty <= 0 ? 'neg' : 'warn')}>{qty}</span>
                </div>
              ))}
            </div>
          ) : <div className="card muted pad">All products above reorder level. 👍</div>}
        </>
      )}
      <h3 className="sec">Data</h3>
      <div className="btn-row">
        <button className="btn ghost" disabled={!db.products.length} onClick={() => download('products.csv', productsCSV(db))}>Export products CSV</button>
        <button className="btn ghost" disabled={!db.movements.length} onClick={() => download('movements.csv', movementsCSV(db))}>Export movements CSV</button>
        {db.products.length > 0 && !hasDemo && <button className="btn ghost" disabled={busy} onClick={() => run(() => loadDemo(s))}>Load demo data</button>}
        {hasDemo && <button className="btn danger" disabled={busy} onClick={() => confirm('Remove all demo data?') && run(() => s.clearDemo())}>Remove demo data</button>}
      </div>
      <p className="foot">Data is stored on this device only. Export CSV regularly as a backup.</p>
    </div>
  )
}
