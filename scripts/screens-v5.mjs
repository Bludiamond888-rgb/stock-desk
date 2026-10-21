import { webkit, devices } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { server, url } = await serve(path.join(root, 'dist'))
const out = (f) => path.join(root, 'screens', f)
const b = await webkit.launch()
const ctx = await b.newContext({ ...devices['iPhone 13'], timezoneId: 'America/New_York', locale: 'en-US' })
const page = await ctx.newPage()
const errs = []; page.on('pageerror', (e) => errs.push(e.message))
const overflow = () => page.evaluate(() => { const W = document.documentElement.clientWidth; const bad = []; document.querySelectorAll('body *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible' && e.children.length === 0)) bad.push(e.tagName + '.' + e.className + ':' + e.textContent.slice(0, 20)) }); return bad })
await page.goto(url + '#/home'); await page.click('button:has-text("Load demo data")'); await page.waitForSelector('[data-testid=stock-value]')
await page.click('[data-testid=settings-btn]'); await page.click('[data-testid=lang] button:has-text("简体中文")'); await page.waitForTimeout(300)
await page.screenshot({ path: out('v5-settings.png') })
await page.click('[aria-label=关闭]')
const all = {}
await page.waitForTimeout(200); await page.screenshot({ path: out('v5-home-zh.png') }); all.home = await overflow()
await page.goto(url + '#/scan'); await page.waitForSelector('.scan-btn'); await page.waitForTimeout(300); await page.screenshot({ path: out('v5-scan-zh.png') }); all.scan = await overflow()
await page.goto(url + '#/products'); await page.waitForSelector('[data-testid=product-card]'); await page.waitForTimeout(300); await page.screenshot({ path: out('v5-products-zh.png') }); all.products = await overflow()
for (const h of ['containers', 'sales']) { await page.goto(url + '#/' + h); await page.waitForTimeout(300); all[h] = await overflow() }
console.log('lang persisted:', await page.evaluate(() => localStorage.getItem('stockdesk.lang')), 'htmllang', await page.evaluate(() => document.documentElement.lang))
console.log('overflow:', JSON.stringify(all), 'errors:', errs.join('|'))
await b.close(); server.close()
