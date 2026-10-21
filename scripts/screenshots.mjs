// Demo-data screenshots into screens/: WebKit iPhone 13 profile + Chromium iPhone & desktop. Also asserts no horizontal overflow.
import { webkit, chromium, devices } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { server, url } = await serve(path.join(root, 'dist'))
const out = (f) => path.join(root, 'screens', f)
let bad = 0
async function check(page, name) {
  const o = await page.evaluate(() => {
    const w = document.documentElement.clientWidth
    const els = [...document.querySelectorAll('input,select,button,.card')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > w + 1 || r.left < -1) })
    return { scroll: document.documentElement.scrollWidth > w, els: els.length }
  })
  if (o.scroll || o.els) { bad++; console.log('OVERFLOW', name, o) }
}
async function shoot(page, name, tag) { await page.waitForTimeout(350); await check(page, name); await page.screenshot({ path: out(`${name}-${tag}.png`) }) }

async function run(browser, ctxOpts, tag, full = false) {
  const ctx = await browser.newContext({ ...ctxOpts, timezoneId: 'America/New_York' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { bad++; console.log('PAGE ERROR', e.message) })
  page.on('dialog', (d) => d.accept())
  await page.goto(url + '#/home'); await page.waitForSelector('.empty')
  await shoot(page, '0-empty', tag)
  await page.click('button:has-text("Load demo data")'); await page.waitForSelector('[data-testid=stock-value]')
  await shoot(page, '1-home', tag)
  if (full) await page.screenshot({ path: out(`1-home-${tag}-full.png`), fullPage: true })
  await page.goto(url + '#/scan'); await page.waitForSelector('.scan-btn'); await shoot(page, '2-scan', tag)
  await page.fill('input[type=search]', 'fan'); await page.click('.row.tap'); await page.waitForSelector('.stepper')
  await page.click('[aria-label=plus]'); await page.click('[aria-label=plus]'); await page.fill('input[list=retailers]', 'Bright Mart')
  await shoot(page, '3-scan-sell', tag)
  await page.click('button:has-text("Sell 3")'); await page.waitForSelector('[data-testid=scan-msg]')
  await page.goto(url + '#/products'); await page.waitForSelector('[data-testid=product-card]'); await shoot(page, '4-products', tag)
  await page.click('[aria-label="QR label FAN-16-WHT"]'); await page.waitForSelector('.label img'); await shoot(page, '5-qr-label', tag)
  await page.click('[aria-label=Close]')
  await page.click('[data-testid=product-card] .prod-main'); await page.waitForSelector('.sheet'); await shoot(page, '6-product-edit', tag)
  await page.click('[aria-label=Close]')
  await page.goto(url + '#/containers'); await page.waitForSelector('[data-testid=container-card]'); await shoot(page, '7-containers', tag)
  await page.click('[data-testid=container-card]'); await page.waitForSelector('.sheet .item'); await shoot(page, '8-container-edit', tag)
  await page.click('[aria-label=Close]')
  await page.goto(url + '#/sales'); await page.waitForSelector('[data-testid=retailer-card]'); await shoot(page, '9-sales', tag)
  await page.click('.seg button:has-text("History")'); await page.waitForSelector('[data-testid=history-row]'); await shoot(page, '10-history', tag)
  await ctx.close()
}

const iphone = { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }
const wk = await webkit.launch(); await run(wk, iphone, 'iphone-webkit', true); await wk.close()
const cr = await chromium.launch()
const { defaultBrowserType: _d, ...crPhone } = iphone
await run(cr, crPhone, 'iphone-chromium')
await run(cr, { viewport: { width: 1280, height: 860 } }, 'desktop-chromium')
await cr.close(); server.close()
console.log(bad ? `DONE with ${bad} problems` : 'screens written, no overflow')
process.exit(bad ? 1 : 0)
