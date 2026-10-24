import { useState } from 'react'
import { useDB, useStore } from '../data/store'
import { loadDemo } from '../lib/demo'
import { dashboard, money0, pct } from '../lib/calc'
import { Empty } from '../ui'
import { useT } from '../i18n'

export default function Home({ onSettings, onCalc }: { onSettings: () => void; onCalc: () => void }) {
  const db = useDB(); const d = dashboard(db); const { t } = useT(); const s = useStore()
  const [busy, setBusy] = useState(false)
  const hour = new Date().getHours()
  return (
    <div className="screen">
      <p className="hello">{t(hour < 12 ? 'home.morning' : hour < 18 ? 'home.afternoon' : 'home.evening')}</p>
      {!db.products.length ? (
        <Empty icon="📦" title={t('home.emptyTitle')}>
          <p>{t('home.emptyBody')}</p>
          <a className="btn primary big" href="#/products">{t('home.addFirst')}</a>
          <button className="btn ghost big" disabled={busy} onClick={async () => { setBusy(true); try { await loadDemo(s) } finally { setBusy(false) } }}>{t('settings.loadDemo')}</button>
          <button className="btn ghost big" data-testid="home-calc-btn" onClick={onCalc}>{t('home.calcCta')}</button>
        </Empty>
      ) : (
        <>
          <div className="hero card grad">
            <span>{t('home.stockValue')}</span>
            <strong data-testid="stock-value">{money0(d.value)}</strong>
            <small>{t('home.summary', { units: d.units.toLocaleString(), products: db.products.length })}</small>
          </div>
          <div className="kpis">
            <div className="card kpi"><span>{t('home.sales')}</span><strong>{money0(d.revenue)}</strong></div>
            <div className="card kpi"><span>{t('home.profit')}</span><strong className="pos">{money0(d.profit)}</strong></div>
            <div className="card kpi"><span>{t('home.margin')}</span><strong>{pct(d.margin)}</strong></div>
            <div className="card kpi"><span>{t('home.unitsSold')}</span><strong>{d.soldUnits.toLocaleString()}</strong></div>
          </div>
          <a className="btn primary big block" href="#/scan">{t('home.scanCta')}</a>
          <button className="btn ghost big block" data-testid="home-calc-btn" onClick={onCalc}>{t('home.calcCta')}</button>
          <h3 className="sec">{t('home.low')} {d.low.length > 0 && <span className="pill warn">{d.low.length}</span>}</h3>
          {d.low.length ? (
            <div className="card list">
              {d.low.map(({ p, qty }) => (
                <div className="row" key={p.id} data-testid="low-row">
                  <div className="grow"><b>{p.name}</b><small>{p.sku} · {t('home.reorderAt', { n: p.reorder })}</small></div>
                  <span className={'qty ' + (qty <= 0 ? 'neg' : 'warn')}>{qty}</span>
                </div>
              ))}
            </div>
          ) : <div className="card muted pad">{t('home.allGood')}</div>}
        </>
      )}
      <button className="link foot" onClick={onSettings}>{t('home.dataHint')}</button>
    </div>
  )
}
