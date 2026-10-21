import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useDB, useStore } from '../data/store'
import { money, productRows } from '../lib/calc'
import type { Product } from '../lib/types'
import { generateSku } from '../lib/sku'
import { Empty, Field, num, Sheet } from '../ui'
import { useT } from '../i18n'
import { labelPng, labelsPdf, preferShare, shareOrOpen, type LabelData } from '../lib/labels'

/** Pre-generates the PNG/PDF so the tap can call navigator.share synchronously (iOS needs user activation). */
function PrintShareButton({ labels, text, className }: { labels: LabelData[]; text: string; className: string }) {
  const { t } = useT()
  const key = JSON.stringify(labels)
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    let ok = true; setFile(null); setErr('')
    const t = setTimeout(() => {
      const make = labels.length === 1 ? labelPng(labels[0]) : labelsPdf(labels)
      make.then((f) => { if (ok) { setFile(f); (window as unknown as { __lastLabelFile?: File }).__lastLabelFile = f } }).catch((e) => ok && setErr(String(e)))
    }, 250)
    return () => { ok = false; clearTimeout(t) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const share = preferShare()
  const click = () => {
    if (!share) { window.print(); return } // desktop: synchronous print in the click handler
    if (file) shareOrOpen(file).catch((e) => setErr(String(e)))
  }
  return <>
    <button className={className} data-testid="print-share" data-ready={file ? '1' : '0'} disabled={share && !file} onClick={click}>{share && !file ? t('prod.preparing') : text}</button>
    {err ? <p className="share-note neg">{err}</p> : share && file && <p className="share-note">{t('prod.shareNote')}</p>}
  </>
}

export function useQR(text: string) {
  const [src, setSrc] = useState('')
  useEffect(() => { if (!text) { setSrc(''); return } let ok = true; QRCode.toDataURL(text, { margin: 1, width: 480, errorCorrectionLevel: 'M' }).then((d) => ok && setSrc(d)); return () => { ok = false } }, [text])
  return src
}

function LabelCard({ sku, name }: { sku: string; name: string }) {
  const src = useQR(sku)
  return <div className="label">{src && <img src={src} alt={'QR ' + sku} />}<div className="label-sku">{sku}</div><div className="label-name">{name}</div></div>
}

function AllLabels({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const { t } = useT()
  return (
    <Sheet title={t('prod.allLabels', { n: products.length })} onClose={onClose}>
      <PrintShareButton className="btn primary big block" text={t('prod.shareAll')} labels={products.map((p) => ({ sku: p.sku, name: p.name }))} />
      <div className="label-grid print-area" data-testid="label-sheet">{products.map((p) => <LabelCard key={p.id} sku={p.sku} name={p.name} />)}</div>
    </Sheet>
  )
}

function Label({ p, onClose }: { p: Product; onClose: () => void }) {
  const { t } = useT()
  return (
    <Sheet title={t('prod.qrLabel')} onClose={onClose}>
      <div className="print-area"><LabelCard sku={p.sku} name={p.name} /></div>
      <PrintShareButton className="btn primary big block" text={t('prod.shareLabel')} labels={[{ sku: p.sku, name: p.name }]} />
    </Sheet>
  )
}

function Edit({ p, onClose }: { p: Partial<Product>; onClose: (saved?: Product) => void }) {
  const s = useStore(); const db = useDB(); const { t } = useT()
  const [f, setF] = useState({ sku: p.sku ?? '', name: p.name ?? '', cost: String(p.cost ?? ''), price: String(p.price ?? ''), reorder: String(p.reorder ?? '10') })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const dup = db.products.some((x) => x.id !== p.id && x.sku.toLowerCase() === f.sku.trim().toLowerCase())
  const ok = f.sku.trim() && f.name.trim() && !dup
  const save = async () => { await s.save('products', [{ ...p, sku: f.sku.trim().toUpperCase(), name: f.name.trim(), cost: num(f.cost), price: num(f.price), reorder: Math.floor(num(f.reorder)) } as Product]); onClose({ ...p, sku: f.sku.trim().toUpperCase() } as Product) }
  const gen = () => setF({ ...f, sku: generateSku(f.name, db.products.filter((x) => x.id !== p.id).map((x) => x.sku)) })
  const sku = f.sku.trim().toUpperCase()
  return (
    <Sheet title={p.id ? t('prod.edit') : t('prod.new')} onClose={onClose}>
      <div className="grid2 form">
        <Field label="SKU" wide><div className="sku-row"><input value={f.sku} onChange={set('sku')} autoCapitalize="characters" placeholder={t('prod.skuPh')} /><button type="button" className="btn" onClick={gen}>{t('prod.generate')}</button></div></Field>
        {dup && <div className="banner err wide">{t('prod.dup')}</div>}
        <Field label={t('prod.name')} wide><input value={f.name} onChange={set('name')} placeholder={t('prod.namePh')} /></Field>
        <Field label={t('common.costUnit')}><input inputMode="decimal" value={f.cost} onChange={set('cost')} placeholder="0.00" /></Field>
        <Field label={t('prod.price')}><input inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0.00" /></Field>
        <Field label={t('prod.reorder')} wide><input inputMode="numeric" value={f.reorder} onChange={set('reorder')} /></Field>
      </div>
      {sku && <><div className="print-area" data-testid="form-label"><LabelCard sku={sku} name={f.name.trim()} /></div>
        <PrintShareButton className="btn block" text={t('prod.shareLabel')} labels={[{ sku, name: f.name.trim() }]} /></>}
      <button className="btn primary big block" disabled={!ok} onClick={save}>{t('prod.save')}</button>
      {p.id && <button className="btn danger block" onClick={async () => { if (confirm(t('prod.confirmDelete'))) { await s.deleteProduct(p.id!); onClose() } }}>{t('prod.delete')}</button>}
    </Sheet>
  )
}

export default function Products() {
  const db = useDB(); const { t } = useT()
  const [edit, setEdit] = useState<Partial<Product> | null>(null)
  const [label, setLabel] = useState<Product | null>(null)
  const [all, setAll] = useState(false)
  const [q, setQ] = useState('')
  const [fromScan, setFromScan] = useState(false)
  useEffect(() => {
    const m = location.hash.match(/[?&]new=([^&]*)/)
    if (m) { setEdit({ sku: decodeURIComponent(m[1]) }); setFromScan(/[?&]from=scan/.test(location.hash)); history.replaceState(null, '', '#/products') }
  }, [])
  const closeEdit = (saved?: Product) => {
    setEdit(null)
    if (fromScan) { setFromScan(false); location.hash = saved ? '#/scan?pick=' + encodeURIComponent(saved.sku) : '#/scan' }
  }
  const rows = productRows(db).filter(({ p }) => (p.sku + ' ' + p.name).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="screen">
      <div className="head-row"><h1>{t('prod.title')}</h1><div className="head-btns">{db.products.length > 0 && <button className="btn" data-testid="all-labels" onClick={() => setAll(true)}>{t('prod.shareAll')}</button>}<button className="btn primary" onClick={() => setEdit({})}>{t('prod.add')}</button></div></div>
      {!db.products.length ? <Empty icon="🏷️" title={t('prod.emptyTitle')}><p>{t('prod.emptyBody')}</p><button className="btn primary big" onClick={() => setEdit({})}>{t('prod.addBtn')}</button></Empty> : (
        <>
          <input type="search" className="search" placeholder={t('prod.searchPh')} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="cards">
            {rows.map(({ p, qty, cost, low }) => (
              <div className="card prod" key={p.id} data-testid="product-card">
                <button className="prod-main" onClick={() => setEdit(p)}>
                  <div className="grow"><b>{p.name}</b><small>{p.sku}</small>
                    <small className="muted">{money(cost)} → {money(p.price)} · {p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0}%</small></div>
                  <span className={'qty big ' + (qty <= 0 ? 'neg' : low ? 'warn' : '')}>{qty}<small>{t('prod.onHand')}</small></span>
                </button>
                <button className="qr-btn" aria-label={t('prod.qrLabel') + ' ' + p.sku} onClick={() => setLabel(p)}>▣ QR</button>
              </div>
            ))}
          </div>
        </>
      )}
      {edit && <Edit p={edit} onClose={closeEdit} />}
      {all && <AllLabels products={db.products} onClose={() => setAll(false)} />}
      {label && <Label p={label} onClose={() => setLabel(null)} />}
    </div>
  )
}
