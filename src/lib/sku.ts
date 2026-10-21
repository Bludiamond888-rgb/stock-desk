/** Readable unique SKU: initials of product name + 3-digit counter (LED-001), fallback SD-0001. */
export function skuPrefix(name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  if (words.length === 1) return words[0].replace(/[0-9]/g, '').slice(0, 3)
  return words.map((w) => w[0]).join('').replace(/[0-9]/g, '').slice(0, 4)
}

export function generateSku(name: string, existing: string[]): string {
  const taken = new Set(existing.map((s) => s.trim().toUpperCase()))
  const pre = skuPrefix(name)
  const [p, width] = pre.length >= 2 ? [pre, 3] : ['SD', 4]
  for (let i = 1; ; i++) {
    const s = `${p}-${String(i).padStart(width, '0')}`
    if (!taken.has(s)) return s
  }
}
