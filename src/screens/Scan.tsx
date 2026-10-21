import { useEffect, useMemo, useRef, useState } from 'react'
import { today, useDB, useStore } from '../data/store'
import { money, onHand } from '../lib/calc'
import type { MoveType, Product } from '../lib/types'
import { Field, num } from '../ui'
import { useT } from '../i18n'

function Camera({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const { t } = useT()
  const [err, setErr] = useState('')
  const done = useRef(false)
  useEffect(() => {
    let stop = () => {}
    let alive = true
    import('html5-qrcode').then(async ({ Html5Qrcode }) => {
      if (!alive) return
      const q = new Html5Qrcode('reader', { verbose: false, useBarCodeDetectorIfSupported: true } as never)
      stop = () => { q.isScanning && q.stop().catch(() => {}) }
      await q.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.75); return { width: s, height: s } } },
        (text) => { if (done.current) return; done.current = true; navigator.vibrate?.(60); stop(); onCode(text.trim()) }, () => {})
      if (!alive) stop()
    }).catch((e) => setErr(String(e?.message ?? e).includes('ermission') ? t('scan.camDenied') : !isSecureContext ? t('scan.camHttps') : t('scan.camFail', { e: e?.message ?? e })))
    return () => { alive = false; stop() }
  }, [onCode]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="cam">
      <div id="reader" />
      {err && <div className="banner err">{err}</div>}
      <button className="btn ghost big block" onClick={onClose}>{t('common.cancel')}</button>
    </div>
  )
}

export default function Scan() {
  const db = useDB(); const s = useStore(); const { t } = useT()
  const [cam, setCam] = useState(false)
  const [q, setQ] = useState('')
  const [p, setP] = useState<Product | null>(null)
  const [type, setType] = useState<MoveType>('out')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [retailer, setRetailer] = useState('')
  const [date, setDate] = useState(today())
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [unknown, setUnknown] = useState('')
  const retailers = useMemo(() => [...new Set(db.movements.filter((m) => m.retailer).map((m) => m.retailer))].sort(), [db.movements])
  const matches = q.trim() ? db.products.filter((x) => (x.sku + ' ' + x.name).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : []

  const pick = (x: Product) => { setP(x); setPrice(String(x.price)); setQty('1'); setQ(''); setMsg(null); setUnknown('') }
  const onCode = (code: string) => {
    setCam(false)
    const sku = code.replace(/^SKU:/i, '')
    const x = db.products.find((y) => y.sku.toLowerCase() === sku.toLowerCase())
    if (x) pick(x); else { setP(null); setMsg(null); setUnknown(sku) }
  }
  // after "Add as new product" → save, Products sends us back with ?pick=SKU
  useEffect(() => {
    const m = location.hash.match(/[?&]pick=([^&]*)/)
    if (!m) return
    const sku = decodeURIComponent(m[1]).toLowerCase()
    const x = db.products.find((y) => y.sku.toLowerCase() === sku)
    if (x) { pick(x); history.replaceState(null, '', '#/scan') }
  }, [db.products])
  useEffect(() => { (window as unknown as { __scanCode?: (c: string) => void }).__scanCode = onCode })
  const stock = p ? onHand(db.movements, p.id) : 0
  const n = Math.floor(num(qty))
  const save = async () => {
    if (!p || n <= 0) return
    await s.move(p.id, type, n, { unitPrice: num(price), retailer, date })
    setMsg({ ok: true, text: t('scan.saved', { sign: type === 'in' ? '+' : '−', n, sku: p.sku }) }); setP(null)
  }

  if (cam) return <div className="screen"><Camera onCode={onCode} onClose={() => setCam(false)} /></div>
  return (
    <div className="screen">
      {msg && <div className={'banner ' + (msg.ok ? 'ok' : 'err')} data-testid="scan-msg">{msg.text}</div>}
      {unknown && !p && (
        <div className="card pad unknown" data-testid="unknown-code">
          <div className="muted">{t('scan.newCode')}</div><div className="label-sku">{unknown}</div>
          <button className="btn primary big block" onClick={() => { location.hash = '#/products?new=' + encodeURIComponent(unknown) + '&from=scan' }}>{t('scan.addNew')}</button>
          <button className="btn ghost block" onClick={() => setUnknown('')}>{t('common.dismiss')}</button>
        </div>
      )}
      {!p ? (
        <>
          <button className="scan-btn" onClick={() => db.products.length ? setCam(true) : setMsg({ ok: false, text: t('scan.noProductsMsg') })}>
            <span className="scan-ring">⌁</span><b>{t('scan.tap')}</b><small>{t('scan.tapSub')}</small>
          </button>
          <Field label={t('scan.search')} wide>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('scan.searchPh')} autoCapitalize="characters" />
          </Field>
          {matches.length > 0 && <div className="card list">{matches.map((x) => (
            <button className="row tap" key={x.id} onClick={() => pick(x)}><div className="grow"><b>{x.sku}</b><small>{x.name}</small></div><span className="qty">{onHand(db.movements, x.id)}</span></button>
          ))}</div>}
          {!db.products.length && <p className="muted center">{t('scan.noProducts')}</p>}
        </>
      ) : (
        <div className="card pad form">
          <div className="picked"><div className="grow"><b>{p.name}</b><small>{p.sku} · {t('scan.onHand')} <b>{stock}</b></small></div><button className="btn ghost sm" onClick={() => setP(null)}>{t('scan.change')}</button></div>
          <div className="seg">
            <button className={type === 'in' ? 'on in' : ''} onClick={() => setType('in')}>{t('scan.in')}</button>
            <button className={type === 'out' ? 'on out' : ''} onClick={() => setType('out')}>{t('scan.out')}</button>
          </div>
          <div className="stepper">
            <button aria-label={t('scan.minus')} onClick={() => setQty(String(Math.max(1, n - 1)))}>−</button>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} aria-label={t('scan.quantity')} />
            <button aria-label={t('scan.plus')} onClick={() => setQty(String(n + 1))}>＋</button>
          </div>
          {type === 'out' && (
            <div className="grid2">
              <Field label={t('scan.retailer')} wide><input list="retailers" value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder={t('scan.retailerPh')} /></Field>
              <datalist id="retailers">{retailers.map((r) => <option key={r} value={r} />)}</datalist>
              <Field label={t('scan.price')}><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              <Field label={t('common.date')}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
          )}
          {type === 'out' && n > stock && <div className="banner warn">{t('scan.negWarn', { n: stock })}</div>}
          <button className="btn primary big block" disabled={n <= 0} onClick={save}>
            {type === 'in' ? t('scan.addBtn', { n: n || 0 }) : t('scan.sellBtn', { n: n || 0, amt: money(n * num(price)) })}
          </button>
        </div>
      )}
    </div>
  )
}
