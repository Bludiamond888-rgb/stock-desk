import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'zh'
export const LANGS: { id: Lang; label: string }[] = [{ id: 'en', label: 'English' }, { id: 'zh', label: '简体中文' }]

const en = {
  'app.name': 'Stock Desk',
  'tab.home': 'Home', 'tab.scan': 'Scan', 'tab.products': 'Products', 'tab.containers': 'Containers', 'tab.sales': 'Sales',
  'common.close': 'Close', 'common.cancel': 'Cancel', 'common.remove': 'Remove', 'common.dismiss': 'Dismiss', 'common.date': 'Date',
  'common.units': '{n} units', 'common.qty': 'Qty', 'common.costUnit': 'Cost / unit', 'common.product': 'Product',
  'settings.title': 'Settings', 'settings.open': 'Settings', 'settings.language': 'Language', 'settings.data': 'Data',
  'settings.exportProducts': 'Export products CSV', 'settings.exportMoves': 'Export movements CSV',
  'settings.demo': 'Demo data', 'settings.loadDemo': 'Load demo data', 'settings.removeDemo': 'Remove demo data',
  'settings.confirmRemoveDemo': 'Remove all demo data?', 'settings.foot': 'Data is stored on this device only. Export CSV regularly as a backup.',
  'home.morning': 'Good morning, Chairman', 'home.afternoon': 'Good afternoon, Chairman', 'home.evening': 'Good evening, Chairman',
  'home.emptyTitle': 'Your warehouse is empty', 'home.emptyBody': 'Add products, log a container arrival, then scan stock in and out.',
  'home.addFirst': 'Add first product', 'home.stockValue': 'Stock value at cost', 'home.summary': '{units} units on hand · {products} products',
  'home.sales': 'Sales', 'home.profit': 'Gross profit', 'home.margin': 'Margin', 'home.unitsSold': 'Units sold',
  'home.scanCta': '⌁ Scan stock in / out', 'home.low': 'Low stock', 'home.reorderAt': 'reorder at {n}', 'home.allGood': 'All products above reorder level. 👍',
  'home.dataHint': 'CSV export and demo data are in Settings ⚙',
  'scan.camDenied': 'Camera permission denied. Allow camera access in Settings › Safari.', 'scan.camHttps': 'Camera needs HTTPS. Open the app from its https:// address.',
  'scan.camFail': 'Could not start camera: {e}', 'scan.saved': 'Saved: {sign}{n} × {sku}', 'scan.newCode': 'New code:', 'scan.addNew': '＋ Add as new product',
  'scan.noProductsMsg': 'No products yet. Open Settings ⚙ on Home and tap Load demo data, or add products in the Products tab.',
  'scan.tap': 'Tap to scan', 'scan.tapSub': 'QR code or barcode', 'scan.search': 'Or search SKU / name', 'scan.searchPh': 'e.g. LED-A19',
  'scan.noProducts': 'No products yet. Load demo data from Settings ⚙ on Home, or add products in the Products tab.',
  'scan.onHand': 'on hand', 'scan.change': 'Change', 'scan.in': '＋ Stock In', 'scan.out': '− Sell Out', 'scan.minus': 'minus', 'scan.plus': 'plus', 'scan.quantity': 'Quantity',
  'scan.retailer': 'Retailer', 'scan.retailerPh': 'Who bought it?', 'scan.price': 'Price / unit', 'scan.negWarn': 'Only {n} on hand — stock will go negative.',
  'scan.addBtn': 'Add {n} to stock', 'scan.sellBtn': 'Sell {n} · {amt}',
  'prod.title': 'Products', 'prod.preparing': 'Preparing…', 'prod.shareNote': 'Opens the share sheet — choose Print, Save to Files or AirDrop.',
  'prod.allLabels': 'All labels ({n})', 'prod.shareAll': 'Print / Share all labels', 'prod.qrLabel': 'QR label', 'prod.shareLabel': 'Print / Share label',
  'prod.edit': 'Edit product', 'prod.new': 'New product', 'prod.sku': 'SKU', 'prod.skuPh': 'e.g. FAN-16-WHT', 'prod.generate': 'Generate', 'prod.dup': 'That SKU already exists.',
  'prod.name': 'Name', 'prod.namePh': 'Product name', 'prod.price': 'Sell price', 'prod.reorder': 'Reorder at (units)', 'prod.save': 'Save product',
  'prod.confirmDelete': 'Delete this product and its stock history?', 'prod.delete': 'Delete product', 'prod.labelsBtn': 'All labels', 'prod.add': '＋ Add',
  'prod.emptyTitle': 'No products yet', 'prod.emptyBody': 'Add each item you import with its SKU, cost and sell price.', 'prod.addBtn': 'Add product',
  'prod.searchPh': 'Search products', 'prod.onHand': 'on hand',
  'cont.title': 'Containers', 'cont.edit': 'Edit container', 'cont.arrival': 'Container arrival', 'cont.ref': 'Container / ref', 'cont.arrived': 'Arrived',
  'cont.freight': 'Freight $', 'cont.duty': 'Duty $', 'cont.items': 'Items', 'cont.choose': 'Choose product…', 'cont.landed': 'Landed', 'cont.addItem': '＋ Add item',
  'cont.goods': 'Goods {v}', 'cont.fd': '+ Freight & duty {v}', 'cont.landedTotal': 'Landed {v}', 'cont.note': 'Freight and duty are spread across items by value to give each a landed unit cost.',
  'cont.save': 'Save changes', 'cont.receive': 'Receive {n} units', 'cont.confirmDelete': 'Delete container and remove its stock?', 'cont.delete': 'Delete container',
  'cont.add': '＋ Arrival', 'cont.emptyTitle': 'No containers logged', 'cont.emptyBody': 'Log an arrival with items, freight and duty — stock is added at landed cost.',
  'cont.emptyNoProd': 'Add products first, then log container arrivals.', 'cont.log': 'Log arrival', 'cont.skus': '{n} SKUs', 'cont.freightV': 'Freight {v}', 'cont.dutyV': 'Duty {v}', 'cont.landedTotalV': 'Landed total',
  'sales.title': 'Sales', 'sales.byRetailer': 'By retailer', 'sales.history': 'History', 'sales.emptyTitle': 'No sales yet',
  'sales.emptyBody': 'Sell stock from the Scan tab — choose “Sell Out” and a retailer.', 'sales.profit': '{v} profit', 'sales.salesV': 'Sales {v}', 'sales.marginV': 'Margin {v}',
  'sales.noMoves': 'No stock movements yet', 'sales.noRetailer': 'No retailer', 'sales.none': '(none)', 'sales.container': 'Container', 'sales.stockIn': 'Stock in',
  'sales.confirmDelete': 'Delete this entry?', 'sales.undo': 'Undo',
}
export type Key = keyof typeof en

const zh: Record<Key, string> = {
  'app.name': 'Stock Desk 库存',
  'tab.home': '首页', 'tab.scan': '扫码', 'tab.products': '产品', 'tab.containers': '到货', 'tab.sales': '销售',
  'common.close': '关闭', 'common.cancel': '取消', 'common.remove': '删除', 'common.dismiss': '忽略', 'common.date': '日期',
  'common.units': '{n} 件', 'common.qty': '数量', 'common.costUnit': '单位成本', 'common.product': '产品',
  'settings.title': '设置', 'settings.open': '设置', 'settings.language': '语言', 'settings.data': '数据',
  'settings.exportProducts': '导出产品 CSV', 'settings.exportMoves': '导出出入库记录 CSV',
  'settings.demo': '演示数据', 'settings.loadDemo': '加载演示数据', 'settings.removeDemo': '删除演示数据',
  'settings.confirmRemoveDemo': '确定删除所有演示数据？', 'settings.foot': '数据仅保存在本设备上。请定期导出 CSV 作为备份。',
  'home.morning': '早上好，董事长', 'home.afternoon': '下午好，董事长', 'home.evening': '晚上好，董事长',
  'home.emptyTitle': '仓库还是空的', 'home.emptyBody': '先添加产品，登记集装箱到货，然后扫码入库和出库。',
  'home.addFirst': '添加第一个产品', 'home.stockValue': '库存价值（按成本）', 'home.summary': '库存 {units} 件 · {products} 个产品',
  'home.sales': '销售额', 'home.profit': '毛利', 'home.margin': '利润率', 'home.unitsSold': '已售件数',
  'home.scanCta': '⌁ 扫码入库 / 出库', 'home.low': '库存不足', 'home.reorderAt': '补货点 {n}', 'home.allGood': '所有产品库存充足。👍',
  'home.dataHint': 'CSV 导出和演示数据在 设置 ⚙ 中',
  'scan.camDenied': '相机权限被拒绝。请在 设置 › Safari 中允许访问相机。', 'scan.camHttps': '相机需要 HTTPS。请通过 https:// 地址打开本应用。',
  'scan.camFail': '无法启动相机：{e}', 'scan.saved': '已保存：{sign}{n} × {sku}', 'scan.newCode': '新编码：', 'scan.addNew': '＋ 添加为新产品',
  'scan.noProductsMsg': '还没有产品。请在首页打开 设置 ⚙ 加载演示数据，或在“产品”页添加产品。',
  'scan.tap': '点击扫码', 'scan.tapSub': '二维码或条形码', 'scan.search': '或搜索 SKU / 名称', 'scan.searchPh': '例如 LED-A19',
  'scan.noProducts': '还没有产品。可在首页 设置 ⚙ 中加载演示数据，或在“产品”页添加产品。',
  'scan.onHand': '库存', 'scan.change': '更换', 'scan.in': '＋ 入库', 'scan.out': '− 出库销售', 'scan.minus': '减少', 'scan.plus': '增加', 'scan.quantity': '数量',
  'scan.retailer': '零售商', 'scan.retailerPh': '卖给谁？', 'scan.price': '单价', 'scan.negWarn': '库存仅剩 {n} 件——库存将变为负数。',
  'scan.addBtn': '入库 {n} 件', 'scan.sellBtn': '销售 {n} 件 · {amt}',
  'prod.title': '产品', 'prod.preparing': '准备中…', 'prod.shareNote': '将打开分享菜单——可选择打印、存储到“文件”或隔空投送。',
  'prod.allLabels': '全部标签（{n}）', 'prod.shareAll': '打印 / 分享全部标签', 'prod.qrLabel': '二维码标签', 'prod.shareLabel': '打印 / 分享标签',
  'prod.edit': '编辑产品', 'prod.new': '新产品', 'prod.sku': 'SKU', 'prod.skuPh': '例如 FAN-16-WHT', 'prod.generate': '生成', 'prod.dup': '该 SKU 已存在。',
  'prod.name': '名称', 'prod.namePh': '产品名称', 'prod.price': '售价', 'prod.reorder': '补货点（件）', 'prod.save': '保存产品',
  'prod.confirmDelete': '确定删除该产品及其库存记录？', 'prod.delete': '删除产品', 'prod.labelsBtn': '全部标签', 'prod.add': '＋ 添加',
  'prod.emptyTitle': '还没有产品', 'prod.emptyBody': '为每个进口产品填写 SKU、成本和售价。', 'prod.addBtn': '添加产品',
  'prod.searchPh': '搜索产品', 'prod.onHand': '库存',
  'cont.title': '集装箱到货', 'cont.edit': '编辑集装箱', 'cont.arrival': '集装箱到货', 'cont.ref': '集装箱号 / 编号', 'cont.arrived': '到货日期',
  'cont.freight': '运费 $', 'cont.duty': '关税 $', 'cont.items': '货品', 'cont.choose': '选择产品…', 'cont.landed': '到岸成本', 'cont.addItem': '＋ 添加货品',
  'cont.goods': '货值 {v}', 'cont.fd': '+ 运费和关税 {v}', 'cont.landedTotal': '到岸成本 {v}', 'cont.note': '运费和关税按货值分摊到各货品，得出每件的到岸成本。',
  'cont.save': '保存修改', 'cont.receive': '入库 {n} 件', 'cont.confirmDelete': '确定删除该集装箱并移除其库存？', 'cont.delete': '删除集装箱',
  'cont.add': '＋ 到货', 'cont.emptyTitle': '还没有到货记录', 'cont.emptyBody': '登记到货的货品、运费和关税——按到岸成本入库。',
  'cont.emptyNoProd': '请先添加产品，再登记集装箱到货。', 'cont.log': '登记到货', 'cont.skus': '{n} 个 SKU', 'cont.freightV': '运费 {v}', 'cont.dutyV': '关税 {v}', 'cont.landedTotalV': '到岸总成本',
  'sales.title': '销售', 'sales.byRetailer': '按零售商', 'sales.history': '记录', 'sales.emptyTitle': '还没有销售',
  'sales.emptyBody': '在“扫码”页出库销售——选择“出库销售”并填写零售商。', 'sales.profit': '利润 {v}', 'sales.salesV': '销售额 {v}', 'sales.marginV': '利润率 {v}',
  'sales.noMoves': '还没有出入库记录', 'sales.noRetailer': '无零售商', 'sales.none': '（无）', 'sales.container': '集装箱', 'sales.stockIn': '入库',
  'sales.confirmDelete': '确定删除这条记录？', 'sales.undo': '撤销',
}
export const DICTS: Record<Lang, Record<Key, string>> = { en, zh }

const LS = 'stockdesk.lang'
export function initialLang(): Lang {
  try { const v = localStorage.getItem(LS); if (v === 'en' || v === 'zh') return v } catch { /* ignore */ }
  return typeof navigator !== 'undefined' && /^zh/i.test(navigator.language || '') ? 'zh' : 'en'
}
export function translate(lang: Lang, k: Key, vars?: Record<string, string | number>) {
  let s = DICTS[lang][k] ?? en[k] ?? k
  if (vars) for (const [n, v] of Object.entries(vars)) s = s.split('{' + n + '}').join(String(v))
  return s
}
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string }
const I18n = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) })
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(initialLang)
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en' }, [lang])
  const setLang = (l: Lang) => { try { localStorage.setItem(LS, l) } catch { /* ignore */ } set(l) }
  return <I18n.Provider value={{ lang, setLang, t: (k, v) => translate(lang, k, v) }}>{children}</I18n.Provider>
}
export const useT = () => useContext(I18n)
