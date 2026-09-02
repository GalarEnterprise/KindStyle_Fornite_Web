import { describe, it, expect } from 'vitest'
import { parseAddIntent } from '@/lib/utils/add-intent'

describe('parseAddIntent', () => {
  it('devuelve null para input vacío', () => {
    expect(parseAddIntent(null)).toBeNull()
    expect(parseAddIntent('')).toBeNull()
  })

  it('parsea productId', () => {
    expect(parseAddIntent('productId:11111111-1111-4111-8111-111111111111')).toEqual({
      type: 'productId',
      value: '11111111-1111-4111-8111-111111111111',
    })
  })

  it('parsea bundle', () => {
    expect(parseAddIntent('bundle:v2:/offer123')).toEqual({
      type: 'bundle',
      value: 'v2:/offer123',
    })
  })

  it('devuelve null para formato desconocido', () => {
    expect(parseAddIntent('foo:bar')).toBeNull()
    expect(parseAddIntent('productId')).toBeNull()
  })
})