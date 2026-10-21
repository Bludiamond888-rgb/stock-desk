import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { IdbRepo } from './data/repo'
import { Store, StoreCtx } from './data/store'

const root = createRoot(document.getElementById('root')!)
const store = new Store(new IdbRepo())
store.init().then(
  () => root.render(<StrictMode><StoreCtx.Provider value={store}><App /></StoreCtx.Provider></StrictMode>),
  (e) => root.render(<div className="banner err" style={{ margin: 40 }}>Couldn't open on-device storage: {String(e?.message ?? e)}</div>),
)
if (import.meta.env.PROD && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((e) => console.warn('SW failed', e)) })
}
