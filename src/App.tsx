import { useEffect, useState } from 'react'
import Home from './screens/Home'
import Scan from './screens/Scan'
import Products from './screens/Products'
import Containers from './screens/Containers'
import Sales from './screens/Sales'
import Settings from './screens/Settings'
import Calculator from './screens/Calculator'
import { useT, type Key } from './i18n'

const TABS = [
  { id: 'home', ico: '◎' },
  { id: 'scan', ico: '⌁' },
  { id: 'products', ico: '▦' },
  { id: 'containers', ico: '⛴' },
  { id: 'sales', ico: '↗' },
] as const
type Tab = (typeof TABS)[number]['id']
const read = (): Tab => { const h = location.hash.replace(/^#\/?/, '').split('?')[0]; return (TABS.some((t) => t.id === h) ? h : 'home') as Tab }

export default function App() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>(read)
  const [settings, setSettings] = useState(false)
  const [calc, setCalc] = useState(false)
  useEffect(() => { const f = () => { setTab(read()); scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return (
    <>
      <header className="top"><div className="brand"><span className="logo" />Stock Desk</div>
        {tab === 'home' && (
          <div className="top-actions">
            <button className="icon-btn calc-open" aria-label={t('calc.open')} data-testid="calc-btn" onClick={() => setCalc(true)}>🧮</button>
            <button className="icon-btn gear" aria-label={t('settings.open')} data-testid="settings-btn" onClick={() => setSettings(true)}>⚙</button>
          </div>
        )}
      </header>
      <main>
        {tab === 'home' && <Home onSettings={() => setSettings(true)} onCalc={() => setCalc(true)} />}
        {tab === 'scan' && <Scan />}
        {tab === 'products' && <Products />}
        {tab === 'containers' && <Containers />}
        {tab === 'sales' && <Sales />}
      </main>
      <nav className="tabs">
        {TABS.map((x) => (
          <a key={x.id} href={'#/' + x.id} className={'tab' + (x.id === tab ? ' on' : '') + (x.id === 'scan' ? ' scan' : '')} aria-current={x.id === tab ? 'page' : undefined}>
            <span className="ico">{x.ico}</span><span className="tab-l">{t(('tab.' + x.id) as Key)}</span>
          </a>
        ))}
      </nav>
      {settings && <Settings onClose={() => setSettings(false)} />}
      {calc && <Calculator onClose={() => setCalc(false)} />}
    </>
  )
}
