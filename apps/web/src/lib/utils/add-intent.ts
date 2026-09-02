export type AddIntent = { type: 'productId'; value: string } | { type: 'bundle'; value: string } | null

export function parseAddIntent(raw: string | null): AddIntent {
  if (!raw) return null

  if (raw.startsWith('productId:')) {
    return { type: 'productId', value: raw.slice('productId:'.length) }
  }

  if (raw.startsWith('bundle:')) {
    return { type: 'bundle', value: raw.slice('bundle:'.length) }
  }

  return null
}