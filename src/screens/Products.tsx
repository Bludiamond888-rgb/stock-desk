import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useDB, useStore } from '../data/store'
import { money, productRows } from '../lib/calc'
import type { Product } from '../lib/types'
import { generateSku } from '../lib/sku'
import { Empty, Field, num, Sheet } from '../ui'

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
  return (
    <Sheet title={`All labels (${products.length})`} onClose={onClose}>
      <button className="btn primary big block" onClick={() => print()}>Print all labels</button>
      <div className="label-grid print-area" data-testid="label-sheet">{products.map((p) => <LabelCard key={p.id} sku={p.sku} name={p.name} />)}</div>
    </Sheet>
  )
}

function Label({ p, onClose }: { p: Product; onClose: () => void }) {
  return (
    <Sheet title="QR label" onClose={onClose}>
      <div className="print-area"><LabelCard sku={p.sku} name={p.name} /></div>
      <button className="btn primary big block" onClick={() => print()}>Print label</button>
    </Sheet>
  )
}

function Edit({ p, onClose }: { p: Partial<Product>; onClose: (saved?: Product) => void }) {
  const s = useStore(); const db = useDB()
  const [f, setF] = useState({ sku: p.sku ?? '', name: p.name ?? '', cost: String(p.cost ?? ''), price: String(p.price ?? ''), reorder: String(p.reorder ?? '10') })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const dup = db.products.some((x) => x.id !== p.id && x.sku.toLowerCase() === f.sku.trim().toLowerCase())
  const ok = f.sku.trim() && f.name.trim() && !dup
  const save = async () => { await s.save('products', [{ ...p, sku: f.sku.trim().toUpperCase(), name: f.name.trim(), cost: num(f.cost), price: num(f.price), reorder: Math.floor(num(f.reorder)) } as Product]); onClose({ ...p, sku: f.sku.trim().toUpperCase() } as Product) }
  const gen = () => setF({ ...f, sku: generateSku(f.name, db.products.filter((x) => x.id !== p.id).map((x) => x.sku)) })
  const sku = f.sku.trim().toUpperCase()
  return (
    <Sheet title={p.id ? 'Edit product' : 'New product'} onClose={onClose}>
      <div className="grid2 form">
        <Field label="SKU" wide><div className="sku-row"><input value={f.sku} onChange={set('sku')} autoCapitalize="characters" placeholder="e.g. FAN-16-WHT" /><button type="button" className="btn" onClick={gen}>Generate</button></div></Field>
        {dup && <div className="banner err wide">That SKU already exists.</div>}
        <Field label="Name" wide><input value={f.name} onChange={set('name')} placeholder="Product name" /></Field>
        <Field label="Cost / unit"><input inputMode="decimal" value={f.cost} onChange={set('cost')} placeholder="0.00" /></Field>
        <Field label="Sell price"><input inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0.00" /></Field>
        <Field label="Reorder at (units)" wide><input inputMode="numeric" value={f.reorder} onChange={set('reorder')} /></Field>
      </div>
      {sku && <><div className="print-area" data-testid="form-label"><LabelCard sku={sku} name={f.name.trim()} /></div>
        <button className="btn block" onClick={() => print()}>Print label</button></>}
      <button className="btn primary big block" disabled={!ok} onClick={save}>Save product</button>
      {p.id && <button className="btn danger block" onClick={async () => { if (confirm('Delete this product and its stock history?')) { await s.deleteProduct(p.id!); onClose() } }}>Delete product</button>}
    </Sheet>
  )
}

export default function Products() {
  const db = useDB()
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
      <div className="head-row"><h1>Products</h1><div className="head-btns">{db.products.length > 0 && <button className="btn" onClick={() => setAll(true)}>Print all labels</button>}<button className="btn primary" onClick={() => setEdit({})}>＋ Add</button></div></div>
      {!db.products.length ? <Empty icon="🏷️" title="No products yet"><p>Add each item you import with its SKU, cost and sell price.</p><button className="btn primary big" onClick={() => setEdit({})}>Add product</button></Empty> : (
        <>
          <input type="search" className="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="cards">
            {rows.map(({ p, qty, cost, low }) => (
              <div className="card prod" key={p.id} data-testid="product-card">
                <button className="prod-main" onClick={() => setEdit(p)}>
                  <div className="grow"><b>{p.name}</b><small>{p.sku}</small>
                    <small className="muted">{money(cost)} → {money(p.price)} · {p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0}%</small></div>
                  <span className={'qty big ' + (qty <= 0 ? 'neg' : low ? 'warn' : '')}>{qty}<small>on hand</small></span>
                </button>
                <button className="qr-btn" aria-label={'QR label ' + p.sku} onClick={() => setLabel(p)}>▣ QR</button>
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
