import type { Store } from '../data/store'

const PRODUCTS = [
  ['LED-A19-9W', 'LED Bulb A19 9W (10pk)', 8.5, 16, 40],
  ['FAN-16-WHT', 'Stand Fan 16" White', 14, 29, 15],
  ['KET-1.7-SS', 'Electric Kettle 1.7L Steel', 9.2, 22, 20],
  ['EXT-6W-3M', 'Extension Lead 6-Way 3m', 4.1, 11, 30],
  ['RCK-5T-BLK', 'Steel Shelf Rack 5-Tier', 18, 39, 10],
  ['UMB-AUTO-BK', 'Auto Umbrella Black', 2.6, 8, 50],
] as const
const RETAILERS = ['Bright Mart', 'Corner Hardware Co.', 'Island Home Store', 'Value Depot']

export async function loadDemo(s: Store) {
  const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10) }
  const ps = await s.save('products', PRODUCTS.map(([sku, name, cost, price, reorder]) => ({ sku, name, cost, price, reorder, demo: true })))
  const id = (sku: string) => ps.find((p) => p.sku === sku)!.id
  await s.saveContainer({ ref: 'MSKU 482190-1', date: d(40), freight: 2400, duty: 1150, demo: true, items: [
    { productId: id('LED-A19-9W'), qty: 300, unitCost: 8.5 }, { productId: id('FAN-16-WHT'), qty: 120, unitCost: 14 },
    { productId: id('KET-1.7-SS'), qty: 150, unitCost: 9.2 }, { productId: id('EXT-6W-3M'), qty: 200, unitCost: 4.1 }] })
  await s.saveContainer({ ref: 'TGHU 771034-6', date: d(12), freight: 1800, duty: 640, demo: true, items: [
    { productId: id('RCK-5T-BLK'), qty: 60, unitCost: 18 }, { productId: id('UMB-AUTO-BK'), qty: 400, unitCost: 2.6 }, { productId: id('LED-A19-9W'), qty: 100, unitCost: 8.2 }] })
  const sales: [string, number, number, number][] = [
    ['LED-A19-9W', 120, 0, 38], ['FAN-16-WHT', 60, 1, 35], ['KET-1.7-SS', 140, 2, 30], ['EXT-6W-3M', 90, 3, 28], ['FAN-16-WHT', 52, 0, 20],
    ['LED-A19-9W', 150, 1, 15], ['RCK-5T-BLK', 22, 2, 9], ['UMB-AUTO-BK', 180, 3, 7], ['EXT-6W-3M', 95, 0, 5], ['LED-A19-9W', 60, 2, 3], ['UMB-AUTO-BK', 200, 1, 1]]
  for (const [sku, qty, r, ago] of sales) {
    const p = ps.find((x) => x.sku === sku)!
    await s.move(p.id, 'out', qty, { retailer: RETAILERS[r], unitPrice: r === 3 ? p.price * 0.92 : p.price, date: d(ago), demo: true })
  }
}
