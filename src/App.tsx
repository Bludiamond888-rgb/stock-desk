import { useEffect, useState } from 'react'
import Home from './screens/Home'
import Scan from './screens/Scan'
import Products from './screens/Products'
import Containers from './screens/Containers'
import Sales from './screens/Sales'

const TABS = [
  { id: 'home', label: 'Home', ico: '◎' },
  { id: 'scan', label: 'Scan', ico: '⌁' },
  { id: 'products', label: 'Products', ico: '▦' },
  { id: 'containers', label: 'Containers', ico: '⛴' },
  { id: 'sales', label: 'Sales', ico: '↗' },
] as const
type Tab = (typeof TABS)[number]['id']
const read = (): Tab => { const h = location.hash.replace(/^#\/?/, '').split('?')[0]; return (TABS.some((t) => t.id === h) ? h : 'home') as Tab }

export default function App() {
  const [tab, setTab] = useState<Tab>(read)
  useEffect(() => { const f = () => { setTab(read()); scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return (
    <>
      <header className="top"><div className="brand"><span className="logo" />Stock Desk</div></header>
      <main>
        {tab === 'home' && <Home />}
        {tab === 'scan' && <Scan />}
        {tab === 'products' && <Products />}
        {tab === 'containers' && <Containers />}
        {tab === 'sales' && <Sales />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <a key={t.id} href={'#/' + t.id} className={'tab' + (t.id === tab ? ' on' : '') + (t.id === 'scan' ? ' scan' : '')} aria-current={t.id === tab ? 'page' : undefined}>
            <span className="ico">{t.ico}</span><span>{t.label}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
