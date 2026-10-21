import { useState } from 'react'
import { useDB, useStore } from '../data/store'
import { movementsCSV, productsCSV } from '../lib/calc'
import { loadDemo } from '../lib/demo'
import { download, Sheet } from '../ui'
import { LANGS, useT } from '../i18n'

export default function Settings({ onClose }: { onClose: () => void }) {
  const db = useDB(); const s = useStore(); const { t, lang, setLang } = useT()
  const [busy, setBusy] = useState(false)
  const hasDemo = db.products.some((p) => p.demo)
  const run = async (f: () => Promise<void>) => { setBusy(true); try { await f() } finally { setBusy(false) } }
  return (
    <Sheet title={t('settings.title')} onClose={onClose}>
      <h3 className="sec">{t('settings.language')}</h3>
      <div className="seg" role="radiogroup" aria-label={t('settings.language')} data-testid="lang">
        {LANGS.map((l) => <button key={l.id} role="radio" aria-checked={lang === l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.label}</button>)}
      </div>
      <h3 className="sec">{t('settings.data')}</h3>
      <div className="btn-col">
        <button className="btn ghost block" disabled={!db.products.length} onClick={() => download('products.csv', productsCSV(db))}>{t('settings.exportProducts')}</button>
        <button className="btn ghost block" disabled={!db.movements.length} onClick={() => download('movements.csv', movementsCSV(db))}>{t('settings.exportMoves')}</button>
      </div>
      <h3 className="sec">{t('settings.demo')}</h3>
      {hasDemo
        ? <button className="btn danger block" disabled={busy} onClick={() => confirm(t('settings.confirmRemoveDemo')) && run(() => s.clearDemo())}>{t('settings.removeDemo')}</button>
        : <button className="btn ghost block" disabled={busy} onClick={() => run(async () => { await loadDemo(s); onClose() })}>{t('settings.loadDemo')}</button>}
      <p className="foot">{t('settings.foot')}</p>
    </Sheet>
  )
}
