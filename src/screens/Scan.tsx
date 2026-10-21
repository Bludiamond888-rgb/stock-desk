import { useEffect, useMemo, useRef, useState } from 'react'
import { today, useDB, useStore } from '../data/store'
import { money, onHand } from '../lib/calc'
import type { MoveType, Product } from '../lib/types'
import { Field, num } from '../ui'

function Camera({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
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
    }).catch((e) => setErr(String(e?.message ?? e).includes('ermission') ? 'Camera permission denied. Allow camera access in Settings › Safari.' : !isSecureContext ? 'Camera needs HTTPS. Open the app from its https:// address.' : 'Could not start camera: ' + (e?.message ?? e)))
    return () => { alive = false; stop() }
  }, [onCode])
  return (
    <div className="cam">
      <div id="reader" />
      {err && <div className="banner err">{err}</div>}
      <button className="btn ghost big block" onClick={onClose}>Cancel</button>
    </div>
  )
}

export default function Scan() {
  const db = useDB(); const s = useStore()
  const [cam, setCam] = useState(false)
  const [q, setQ] = useState('')
  const [p, setP] = useState<Product | null>(null)
  const [type, setType] = useState<MoveType>('out')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [retailer, setRetailer] = useState('')
  const [date, setDate] = useState(today())
  const [msg, setMsg] = useState('')
  const retailers = useMemo(() => [...new Set(db.movements.filter((m) => m.retailer).map((m) => m.retailer))].sort(), [db.movements])
  const matches = q.trim() ? db.products.filter((x) => (x.sku + ' ' + x.name).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : []

  const pick = (x: Product) => { setP(x); setPrice(String(x.price)); setQty('1'); setQ(''); setMsg('') }
  const onCode = (code: string) => {
    setCam(false)
    const sku = code.replace(/^SKU:/i, '')
    const x = db.products.find((y) => y.sku.toLowerCase() === sku.toLowerCase())
    if (x) pick(x); else { setQ(sku); setMsg(`No product with SKU “${sku}”.`) }
  }
  const stock = p ? onHand(db.movements, p.id) : 0
  const n = Math.floor(num(qty))
  const save = async () => {
    if (!p || n <= 0) return
    await s.move(p.id, type, n, { unitPrice: num(price), retailer, date })
    setMsg(`Saved: ${type === 'in' ? '+' : '−'}${n} × ${p.sku}`); setP(null)
  }

  if (cam) return <div className="screen"><Camera onCode={onCode} onClose={() => setCam(false)} /></div>
  return (
    <div className="screen">
      {msg && <div className={'banner ' + (msg.startsWith('Saved') ? 'ok' : 'err')} data-testid="scan-msg">{msg}</div>}
      {!p ? (
        <>
          <button className="scan-btn" onClick={() => db.products.length ? setCam(true) : setMsg('No products yet. Go to Home and tap Load demo data, or add products in the Products tab.')}>
            <span className="scan-ring">⌁</span><b>Tap to scan</b><small>QR code or barcode</small>
          </button>
          <Field label="Or search SKU / name" wide>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. LED-A19" autoCapitalize="characters" />
          </Field>
          {matches.length > 0 && <div className="card list">{matches.map((x) => (
            <button className="row tap" key={x.id} onClick={() => pick(x)}><div className="grow"><b>{x.sku}</b><small>{x.name}</small></div><span className="qty">{onHand(db.movements, x.id)}</span></button>
          ))}</div>}
          {!db.products.length && <p className="muted center">No products yet. Tap <b>Load demo data</b> on Home, or add products in the Products tab.</p>}
        </>
      ) : (
        <div className="card pad form">
          <div className="picked"><div className="grow"><b>{p.name}</b><small>{p.sku} · on hand <b>{stock}</b></small></div><button className="btn ghost sm" onClick={() => setP(null)}>Change</button></div>
          <div className="seg">
            <button className={type === 'in' ? 'on in' : ''} onClick={() => setType('in')}>＋ Stock In</button>
            <button className={type === 'out' ? 'on out' : ''} onClick={() => setType('out')}>− Sell Out</button>
          </div>
          <div className="stepper">
            <button aria-label="minus" onClick={() => setQty(String(Math.max(1, n - 1)))}>−</button>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} aria-label="Quantity" />
            <button aria-label="plus" onClick={() => setQty(String(n + 1))}>＋</button>
          </div>
          {type === 'out' && (
            <div className="grid2">
              <Field label="Retailer" wide><input list="retailers" value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder="Who bought it?" /></Field>
              <datalist id="retailers">{retailers.map((r) => <option key={r} value={r} />)}</datalist>
              <Field label="Price / unit"><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
          )}
          {type === 'out' && n > stock && <div className="banner warn">Only {stock} on hand — stock will go negative.</div>}
          <button className="btn primary big block" disabled={n <= 0} onClick={save}>
            {type === 'in' ? `Add ${n || 0} to stock` : `Sell ${n || 0} · ${money(n * num(price))}`}
          </button>
        </div>
      )}
    </div>
  )
}
