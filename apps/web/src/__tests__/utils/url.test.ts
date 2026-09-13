import { describe, it, expect } from 'vitest'
import { isValidImageUrl } from '@/lib/utils/url'

describe('isValidImageUrl', () => {
  it('devuelve false para null y undefined', () => {
    expect(isValidImageUrl(null)).toBe(false)
    expect(isValidImageUrl(undefined)).toBe(false)
  })

  it('devuelve false para string vacío o solo espacios', () => {
    expect(isValidImageUrl('')).toBe(false)
    expect(isValidImageUrl('   ')).toBe(false)
  })

  it('acepta URLs HTTPS válidas', () => {
    expect(isValidImageUrl('https://fortnite-api.com/images/x.png')).toBe(true)
    expect(isValidImageUrl('https://cdn2.epicgames.com/img.png')).toBe(true)
    expect(isValidImageUrl('  https://example.com/img.png  ')).toBe(true)
  })

  it('rechaza URLs HTTP', () => {
    expect(isValidImageUrl('http://fortnite-api.com/img.png')).toBe(false)
    expect(isValidImageUrl('HTTP://example.com/img.png')).toBe(false)
  })

  it('rechaza protocolos no seguros', () => {
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false)
    expect(isValidImageUrl('data:image/png;base64,AAAA')).toBe(false)
    expect(isValidImageUrl('ftp://example.com/img.png')).toBe(false)
  })

  it('acepta rutas relativas', () => {
    expect(isValidImageUrl('/images/foo.png')).toBe(true)
    expect(isValidImageUrl('./foo.png')).toBe(true)
    expect(isValidImageUrl('../foo.png')).toBe(true)
    expect(isValidImageUrl('foo.png')).toBe(true)
  })

  it('rechaza URLs malformadas', () => {
    expect(isValidImageUrl('https://')).toBe(false)
    expect(isValidImageUrl('not a url')).toBe(false)
    expect(isValidImageUrl('//cdn.example.com/img.png')).toBe(false)
  })
})
