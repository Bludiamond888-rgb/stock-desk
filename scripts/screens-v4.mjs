import { webkit, devices } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { server, url } = await serve(path.join(root, 'dist'))
const out = (f) => path.join(root, 'screens', f)
const b = await webkit.launch()
const ctx = await b.newContext({ ...devices['iPhone 13'], timezoneId: 'America/New_York' })
const page = await ctx.newPage()
const ext = []; page.on('request', (r) => { if (!r.url().startsWith(url) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) ext.push(r.url()) })
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
// stub share like iOS (canShare files) and record calls
await page.addInitScript(() => { window.__shared = []; navigator.canShare = (d) => !!d?.files; navigator.share = async (d) => { window.__shared.push(d.files.map((f) => [f.name, f.type, f.size])) } })
const fileInfo = () => page.evaluate(async () => { const f = window.__lastLabelFile; const u8 = new Uint8Array(await f.arrayBuffer()); return { name: f.name, type: f.type, size: f.size, head: String.fromCharCode(...u8.slice(1, 4)) + '|' + String.fromCharCode(...u8.slice(0, 5)), b64: f.type === 'image/png' ? btoa(Array.from(u8, (c) => String.fromCharCode(c)).join('')) : '' } })
await page.goto(url + '#/home'); await page.click('button:has-text("Load demo data")'); await page.waitForSelector('[data-testid=stock-value]')
await page.waitForTimeout(300); await page.screenshot({ path: out('v4-home.png') })
await page.goto(url + '#/scan'); await page.waitForSelector('.scan-btn'); await page.waitForTimeout(300); await page.screenshot({ path: out('v4-scan.png') })
await page.goto(url + '#/products'); await page.waitForSelector('[data-testid=product-card]'); await page.waitForTimeout(300); await page.screenshot({ path: out('v4-products.png') })
await page.click('.qr-btn >> nth=0'); await page.waitForSelector('[data-testid=print-share][data-ready="1"]')
const png = await fileInfo(); console.log('single:', png.name, png.type, png.size, png.head)
fs.writeFileSync(out('v4-label.png'), Buffer.from(png.b64, 'base64'))
await page.screenshot({ path: out('v4-share-label.png') })
await page.click('[data-testid=print-share]'); await page.waitForTimeout(200)
await page.click('[aria-label=Close]')
await page.click('button:has-text("Print / Share all labels")'); await page.waitForSelector('[data-testid=print-share][data-ready="1"]')
const pdf = await fileInfo(); console.log('sheet:', pdf.name, pdf.type, pdf.size, pdf.head)
await page.screenshot({ path: out('v4-share-all.png') })
await page.click('[data-testid=print-share]'); await page.waitForTimeout(200)
console.log('share calls:', JSON.stringify(await page.evaluate(() => window.__shared)))
console.log('external requests:', ext.length, 'errors:', errs.length, errs.join(' | '))
if (errs.length || ext.length || png.type !== 'image/png' || !pdf.head.includes('%PDF')) process.exitCode = 1
await b.close(); server.close()
