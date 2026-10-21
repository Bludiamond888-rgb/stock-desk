import { describe, expect, it } from 'vitest'
import { generateSku, skuPrefix } from './sku'

describe('SKU generator', () => {
  it('uses initials of multi-word names', () => { expect(generateSku('Desk Fan White', [])).toBe('DFW-001') })
  it('uses first 3 letters of single word', () => { expect(generateSku('LED bulb', [])).toBe('LB-001'); expect(generateSku('Ledlight', [])).toBe('LED-001') })
  it('never duplicates (case-insensitive)', () => { expect(generateSku('Ledlight', ['led-001', 'LED-002'])).toBe('LED-003') })
  it('fills gaps', () => { expect(generateSku('Ledlight', ['LED-002'])).toBe('LED-001') })
  it('falls back to SD-0001 for empty/short names', () => {
    expect(generateSku('', [])).toBe('SD-0001'); expect(generateSku('X', ['SD-0001'])).toBe('SD-0002'); expect(generateSku('!!', [])).toBe('SD-0001')
  })
  it('ignores digits in prefix', () => { expect(skuPrefix('16 inch fan')).toBe('IF') })
})
