import { describe, expect, it } from 'vitest'
import { DICTS, translate } from './index'
describe('i18n', () => {
  it('every key exists in both languages, non-empty, same placeholders', () => {
    const en = Object.keys(DICTS.en).sort(), zh = Object.keys(DICTS.zh).sort()
    expect(zh).toEqual(en)
    for (const k of en) {
      const a = DICTS.en[k as keyof typeof DICTS.en], b = DICTS.zh[k as keyof typeof DICTS.zh]
      expect(a.trim(), k).not.toBe(''); expect(b.trim(), k).not.toBe('')
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
      expect(ph(b), k).toEqual(ph(a))
    }
  })
  it('interpolates', () => { expect(translate('zh', 'scan.addBtn', { n: 3 })).toBe('入库 3 件') })
})
