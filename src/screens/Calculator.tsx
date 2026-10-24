import { useReducer } from 'react'
import { Sheet } from '../ui'
import { useT, type Key } from '../i18n'
import { initialCalc, reduceCalc, type CalcAction } from '../lib/numpad'

type KeyDef = { label: string; aria: Key | string; action: CalcAction; className?: string; testId: string }

const KEYS: KeyDef[] = [
  { label: 'C', aria: 'calc.clear', action: { type: 'clear' }, className: 'calc-fn', testId: 'clear' },
  { label: '⌫', aria: 'calc.back', action: { type: 'back' }, className: 'calc-fn', testId: 'back' },
  { label: '÷', aria: 'calc.div', action: { type: 'op', op: '÷' }, className: 'calc-op', testId: '÷' },
  { label: '×', aria: 'calc.mul', action: { type: 'op', op: '×' }, className: 'calc-op', testId: '×' },
  { label: '7', aria: '7', action: { type: 'digit', d: '7' }, testId: '7' },
  { label: '8', aria: '8', action: { type: 'digit', d: '8' }, testId: '8' },
  { label: '9', aria: '9', action: { type: 'digit', d: '9' }, testId: '9' },
  { label: '−', aria: 'calc.sub', action: { type: 'op', op: '-' }, className: 'calc-op', testId: '-' },
  { label: '4', aria: '4', action: { type: 'digit', d: '4' }, testId: '4' },
  { label: '5', aria: '5', action: { type: 'digit', d: '5' }, testId: '5' },
  { label: '6', aria: '6', action: { type: 'digit', d: '6' }, testId: '6' },
  { label: '+', aria: 'calc.add', action: { type: 'op', op: '+' }, className: 'calc-op', testId: '+' },
  { label: '1', aria: '1', action: { type: 'digit', d: '1' }, testId: '1' },
  { label: '2', aria: '2', action: { type: 'digit', d: '2' }, testId: '2' },
  { label: '3', aria: '3', action: { type: 'digit', d: '3' }, testId: '3' },
  { label: '=', aria: 'calc.eq', action: { type: 'eq' }, className: 'calc-eq', testId: 'eq' },
  { label: '0', aria: '0', action: { type: 'digit', d: '0' }, className: 'calc-zero', testId: '0' },
  { label: '.', aria: 'calc.dot', action: { type: 'dot' }, testId: 'dot' },
]

export default function Calculator({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const [state, dispatch] = useReducer(reduceCalc, undefined, initialCalc)
  const labelOf = (aria: Key | string) => (aria.startsWith('calc.') ? t(aria as Key) : aria)

  return (
    <Sheet title={t('calc.title')} onClose={onClose}>
      <div className="calc" data-testid="calculator">
        <div className="calc-display" aria-live="polite">
          <div className="calc-expr" data-testid="calc-expr">{state.expr || '\u00a0'}</div>
          <div className={'calc-result' + (state.error ? ' err' : '')} data-testid="calc-result">{state.display}</div>
        </div>
        <div className="calc-pad" role="group" aria-label={t('calc.pad')}>
          {KEYS.map((k) => (
            <button
              key={k.testId}
              type="button"
              className={'calc-key' + (k.className ? ' ' + k.className : '')}
              aria-label={labelOf(k.aria)}
              data-testid={'calc-' + k.testId}
              onClick={() => dispatch(k.action)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
