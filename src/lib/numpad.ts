/** Pure number-pad calculator state machine (session-only; no persistence). */

export type Op = '+' | '-' | '×' | '÷'

export interface CalcState {
  /** Digits currently being typed (or last result after =). */
  display: string
  /** Left operand waiting for the next number, if any. */
  acc: number | null
  /** Pending binary operator. */
  pending: Op | null
  /** After equals / op, the next digit starts a fresh entry. */
  fresh: boolean
  /** Expression line shown above the result, e.g. "12 +". */
  expr: string
  error: boolean
}

export const initialCalc = (): CalcState => ({
  display: '0',
  acc: null,
  pending: null,
  fresh: true,
  expr: '',
  error: false,
})

const MAX_LEN = 14

function formatNum(n: number): string {
  if (!isFinite(n)) return 'Error'
  // Trim floating noise, keep readable length
  let s = String(n)
  if (s.includes('e') || s.includes('E')) {
    s = n.toPrecision(10).replace(/\.?0+e/, 'e').replace(/e\+?/, 'e')
  } else if (s.includes('.')) {
    s = parseFloat(n.toFixed(10)).toString()
  }
  if (s.length > MAX_LEN) {
    s = n.toPrecision(10).replace(/\.?0+$/, '')
    if (s.length > MAX_LEN) s = n.toExponential(6)
  }
  return s
}

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '×': return a * b
    case '÷': return b === 0 ? NaN : a / b
  }
}

function parseDisplay(s: string): number {
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

export function inputDigit(state: CalcState, d: string): CalcState {
  if (state.error) return inputDigit(initialCalc(), d)
  if (state.fresh) {
    return { ...state, display: d, fresh: false, error: false }
  }
  if (state.display === '0' && d !== '.') return { ...state, display: d }
  if (state.display.replace('-', '').replace('.', '').length >= MAX_LEN) return state
  return { ...state, display: state.display + d }
}

export function inputDot(state: CalcState): CalcState {
  if (state.error) return inputDot(initialCalc())
  if (state.fresh) return { ...state, display: '0.', fresh: false, error: false }
  if (state.display.includes('.')) return state
  return { ...state, display: state.display + '.' }
}

export function clearAll(_state?: CalcState): CalcState {
  return initialCalc()
}

export function backspace(state: CalcState): CalcState {
  if (state.error) return initialCalc()
  if (state.fresh) return state
  const next = state.display.slice(0, -1)
  if (!next || next === '-' || next === '-0') return { ...state, display: '0', fresh: true }
  return { ...state, display: next }
}

export function inputOp(state: CalcState, op: Op): CalcState {
  if (state.error) return { ...initialCalc(), pending: op, acc: 0, expr: '0 ' + op, fresh: true }
  const cur = parseDisplay(state.display)
  if (state.acc !== null && state.pending && !state.fresh) {
    const result = apply(state.acc, state.pending, cur)
    if (!isFinite(result)) return { ...initialCalc(), display: 'Error', error: true, expr: '' }
    return {
      display: formatNum(result),
      acc: result,
      pending: op,
      fresh: true,
      expr: formatNum(result) + ' ' + op,
      error: false,
    }
  }
  return {
    ...state,
    acc: cur,
    pending: op,
    fresh: true,
    expr: formatNum(cur) + ' ' + op,
    error: false,
  }
}

export function equals(state: CalcState): CalcState {
  if (state.error) return initialCalc()
  if (state.acc === null || !state.pending) {
    return { ...state, expr: '', fresh: true }
  }
  const cur = parseDisplay(state.display)
  const result = apply(state.acc, state.pending, cur)
  if (!isFinite(result)) {
    return { ...initialCalc(), display: 'Error', error: true, expr: '' }
  }
  const left = formatNum(state.acc)
  const right = formatNum(cur)
  return {
    display: formatNum(result),
    acc: null,
    pending: null,
    fresh: true,
    expr: left + ' ' + state.pending + ' ' + right + ' =',
    error: false,
  }
}

export type CalcAction =
  | { type: 'digit'; d: string }
  | { type: 'dot' }
  | { type: 'clear' }
  | { type: 'back' }
  | { type: 'op'; op: Op }
  | { type: 'eq' }

export function reduceCalc(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'digit': return inputDigit(state, action.d)
    case 'dot': return inputDot(state)
    case 'clear': return clearAll()
    case 'back': return backspace(state)
    case 'op': return inputOp(state, action.op)
    case 'eq': return equals(state)
  }
}
