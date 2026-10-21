import { useState } from 'react'
import { useDB, useStore } from '../data/store'
import { byRetailer, money, money0, pct } from '../lib/calc'
import { Empty } from '../ui'

export default function Sales() {
  const db = useDB(); const s = useStore()
  const [view, setView] = useState<'retailers' | 'history'>('retailers')
  const P = new Map(db.products.map((p) => [p.id, p]))
  const rs = byRetailer(db.movements)
  const max = Math.max(1, ...rs.map((r) => r.revenue))
  const hist = [...db.movements].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 200)
  return (
    <div className="screen">
      <h1>Sales</h1>
      <div className="seg"><button className={view === 'retailers' ? 'on' : ''} onClick={() => setView('retailers')}>By retailer</button><button className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}>History</button></div>
      {view === 'retailers' ? (!rs.length ? <Empty icon="🧾" title="No sales yet"><p>Sell stock from the Scan tab — choose “Sell Out” and a retailer.</p></Empty> :
        <div className="cards">{rs.map((r) => (
          <div className="card pad" key={r.name} data-testid="retailer-card">
            <div className="row0"><b>{r.name}</b><span className="pos">{money0(r.profit)} profit</span></div>
            <div className="bar"><i style={{ width: (r.revenue / max) * 100 + '%' }} /></div>
            <div className="chips"><span>Sales {money0(r.revenue)}</span><span>{r.units.toLocaleString()} units</span><span>Margin {pct(r.margin)}</span></div>
          </div>
        ))}</div>
      ) : (!hist.length ? <Empty icon="🧾" title="No stock movements yet" /> :
        <div className="card list">{hist.map((m) => {
          const p = P.get(m.productId)
          return (
            <div className="row" key={m.id} data-testid="history-row">
              <span className={'dot ' + m.type}>{m.type === 'in' ? '＋' : '−'}</span>
              <div className="grow"><b>{p?.sku ?? '?'} × {m.qty}</b><small>{m.date} · {m.type === 'out' ? (m.retailer || 'No retailer') : m.containerId ? 'Container' : 'Stock in'}</small></div>
              <div className="right">{m.type === 'out' ? <><b>{money(m.qty * m.unitPrice)}</b><small className="pos">+{money(m.qty * (m.unitPrice - m.unitCost))}</small></> : <small className="muted">@ {money(m.unitCost)}</small>}
                {!m.containerId && <button className="link danger" onClick={() => confirm('Delete this entry?') && s.remove('movements', [m.id])}>Undo</button>}</div>
            </div>
          )
        })}</div>
      )}
    </div>
  )
}
