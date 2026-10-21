import { useEffect, type ReactNode } from 'react'
import { useT } from './i18n'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useT()
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head"><h2>{title}</h2><button className="icon-btn" aria-label={t('common.close')} onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  )
}
export const Empty = ({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) => (
  <div className="empty"><div className="empty-ico">{icon}</div><h3>{title}</h3>{children}</div>
)
export const Field = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => (
  <label className={'field' + (wide ? ' wide' : '')}><span>{label}</span>{children}</label>
)
export const num = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : 0 }
export function download(name: string, text: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
