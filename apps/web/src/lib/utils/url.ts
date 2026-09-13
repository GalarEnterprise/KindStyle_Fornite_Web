const HAS_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

export function isValidImageUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false

  const trimmed = url.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('//')) return false
  if (trimmed.startsWith('/')) return !/\s/.test(trimmed)

  if (HAS_SCHEME_RE.test(trimmed)) {
    try {
      const protocol = new URL(trimmed).protocol
      return protocol === 'https:' || protocol === 'http:'
    } catch {
      return false
    }
  }

  return !/\s/.test(trimmed)
}
