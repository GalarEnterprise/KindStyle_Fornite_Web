export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.trim().replace(/^#/, '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  if (expanded.length !== 6 && expanded.length !== 8) return hex

  const r = parseInt(expanded.slice(0, 2), 16)
  const g = parseInt(expanded.slice(2, 4), 16)
  const b = parseInt(expanded.slice(4, 6), 16)

  if ([r, g, b].some((value) => Number.isNaN(value))) return hex

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function buildSectionGradient(
  color1: string,
  color2: string | undefined,
  color3: string
): string {
  if (color2) {
    return `radial-gradient(circle at 50% 30%, ${color2} 0%, ${color1} 45%, ${color3} 100%)`
  }
  return `radial-gradient(circle at 50% 30%, ${color1} 0%, ${color3} 100%)`
}

export function buildSectionTint(
  color1: string,
  color2: string | undefined,
  color3: string
): string {
  const center = color2 ?? color1
  return `radial-gradient(circle at 50% 30%, ${withAlpha(center, 0.35)} 0%, ${withAlpha(color1, 0.22)} 45%, ${withAlpha(color3, 0.16)} 100%)`
}
