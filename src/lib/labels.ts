import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

export type LabelData = { sku: string; name: string }

/** iOS (incl. iPadOS desktop UA) or installed home-screen app: window.print() is unreliable/no-op there. */
export function preferShare(): boolean {
  const n = navigator as Navigator & { standalone?: boolean }
  const ios = /iPad|iPhone|iPod/.test(n.userAgent) || (n.userAgent.includes('Macintosh') && n.maxTouchPoints > 1)
  const standalone = n.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
  return ios || standalone
}

const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'label'

function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, start: number) {
  let px = start
  ctx.font = font(px)
  while (px > 10 && ctx.measureText(text).width > max) { px -= 2; ctx.font = font(px) }
  return px
}

/** Draw one label (QR + big SKU + name) on a white canvas. */
export async function drawLabel(l: LabelData, W = 600, H = 760): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const qr = document.createElement('canvas')
  await QRCode.toCanvas(qr, l.sku, { margin: 1, width: Math.round(W * 0.78), errorCorrectionLevel: 'M' })
  ctx.imageSmoothingEnabled = false
  const q = Math.round(W * 0.78); ctx.drawImage(qr, (W - q) / 2, W * 0.05, q, q)
  ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const mono = (px: number) => `800 ${px}px ui-monospace, Menlo, monospace`
  const skuPx = fit(ctx, l.sku, mono, W * 0.92, Math.round(W * 0.13))
  const y1 = W * 0.05 + q + skuPx * 1.05; ctx.fillText(l.sku, W / 2, y1)
  if (l.name) {
    const sans = (px: number) => `500 ${px}px -apple-system, Helvetica, Arial, sans-serif`
    const np = fit(ctx, l.name, sans, W * 0.92, Math.round(W * 0.06))
    ctx.fillText(l.name, W / 2, y1 + np * 1.5)
  }
  return c
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('PNG failed'))), 'image/png'))

export async function labelPng(l: LabelData): Promise<File> {
  return new File([await toBlob(await drawLabel(l))], `label-${safe(l.sku)}.png`, { type: 'image/png' })
}

/** US Letter sheet, 3 x 4 labels per page. */
export async function labelsPdf(list: LabelData[]): Promise<File> {
  const pdf = new jsPDF({ unit: 'mm', format: 'letter', compress: true })
  const cols = 3, rows = 4, m = 10, pw = 215.9, ph = 279.4
  const cw = (pw - 2 * m) / cols, ch = (ph - 2 * m) / rows
  for (let i = 0; i < list.length; i++) {
    const k = i % (cols * rows)
    if (i && !k) pdf.addPage()
    const x = m + (k % cols) * cw, y = m + Math.floor(k / cols) * ch
    const c = await drawLabel(list[i], 300, 380)
    const h = ch - 4, w = h * (300 / 380)
    pdf.addImage(c.toDataURL('image/png'), 'PNG', x + (cw - w) / 2, y + 2, w, h, undefined, 'FAST')
    pdf.setDrawColor(190); pdf.setLineDashPattern([1, 1], 0); pdf.rect(x, y, cw, ch)
  }
  return new File([pdf.output('blob')], `labels-${list.length}.pdf`, { type: 'application/pdf' })
}

export type ShareResult = 'shared' | 'cancelled' | 'opened' | 'downloaded'

/** Must be called synchronously from a tap (file already generated) to keep user activation on iOS. */
export async function shareOrOpen(file: File): Promise<ShareResult> {
  const n = navigator as Navigator
  if (n.canShare && n.share && n.canShare({ files: [file] })) {
    try { await n.share({ files: [file], title: file.name }); return 'shared' }
    catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  const url = URL.createObjectURL(file)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  const w = window.open(url, '_blank')
  if (w) return 'opened'
  const a = document.createElement('a'); a.href = url; a.download = file.name
  document.body.appendChild(a); a.click(); a.remove()
  return 'downloaded'
}
