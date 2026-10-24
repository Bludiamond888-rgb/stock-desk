import { webkit } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { server, url } = await serve(path.join(root, 'dist'))
const out = (f) => path.join(root, 'screens', f)

// iPhone 16 Pro Max–ish: 440×956 @ deviceScaleFactor 3
const viewport = { width: 440, height: 956 }
const b = await webkit.launch()
const ctx = await b.newContext({
  viewport,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  timezoneId: 'America/New_York',
  locale: 'en-US',
})
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(e.message))

await page.goto(url + '#/home')
await page.waitForTimeout(400)

// Empty home with calc entry (before demo)
await page.screenshot({ path: out('v6-home-empty-calc-entry-iphone-webkit.png') })

// Open calculator from header button
await page.click('[data-testid=calc-btn]')
await page.waitForSelector('[data-testid=calculator]')
await page.waitForTimeout(250)
await page.screenshot({ path: out('v6-calculator-iphone-webkit.png') })

// Type a sample expression so UI shows expression + result
await page.click('[data-testid="calc-1"]')
await page.click('[data-testid="calc-2"]')
await page.click('[data-testid="calc-+"]')
await page.click('[data-testid="calc-3"]')
await page.click('[data-testid="calc-4"]')
await page.waitForTimeout(150)
await page.screenshot({ path: out('v6-calculator-expression-iphone-webkit.png') })
await page.click('[data-testid="calc-eq"]')
await page.waitForTimeout(150)
await page.screenshot({ path: out('v6-calculator-result-iphone-webkit.png') })

// Close and load demo, show Home with calc CTA
await page.click('[aria-label=Close]')
await page.waitForTimeout(200)
const load = page.getByRole('button', { name: /Load demo data|加载演示数据/ })
if (await load.count()) {
  await load.click()
  await page.waitForSelector('[data-testid=stock-value]')
}
await page.waitForTimeout(300)
await page.screenshot({ path: out('v6-home-with-calc-cta-iphone-webkit.png') })

// ZH calculator
await page.click('[data-testid=settings-btn]')
await page.click('[data-testid=lang] button:has-text("简体中文")')
await page.waitForTimeout(200)
await page.click('[aria-label=关闭]')
await page.click('[data-testid=calc-btn]')
await page.waitForSelector('[data-testid=calculator]')
await page.waitForTimeout(250)
await page.screenshot({ path: out('v6-calculator-zh-iphone-webkit.png') })

console.log('errors:', errs.join('|') || '(none)')
await b.close()
server.close()
