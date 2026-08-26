import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { encryptCredentials, decryptCredentials, isEncryptedCredentials } from '@/lib/services/cart/crypto-service'

describe('Crypto Service', () => {
  const originalKey = process.env.ENCRYPTION_KEY

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = originalKey ?? 'test-encryption-key-for-vitest'
  })

  afterAll(() => {
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY
    } else {
      process.env.ENCRYPTION_KEY = originalKey
    }
  })

  it('roundtrip: cifrar y descifrar devuelve el texto original', () => {
    const plain = JSON.stringify({ epicEmail: 'player@test.com', epicPassword: 'secret123' })
    const encrypted = encryptCredentials(plain)

    expect(isEncryptedCredentials(encrypted)).toBe(true)
    expect(decryptCredentials(encrypted)).toBe(plain)
  })

  it('usa IVs distintos en cada operación', () => {
    const plain = 'mismo-texto'
    const a = encryptCredentials(plain)
    const b = encryptCredentials(plain)

    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it('no guarda el texto plano en el resultado', () => {
    const secret = 'mi-password-secreta'
    const encrypted = encryptCredentials(secret)

    expect(encrypted.data).not.toContain(secret)
    expect(JSON.stringify(encrypted)).not.toContain(secret)
  })

  it('falla con datos corruptos (auth tag inválido)', () => {
    const encrypted = encryptCredentials('datos-validos')
    const corrupted = { ...encrypted, data: Buffer.from('corrupto').toString('base64') }

    expect(() => decryptCredentials(corrupted)).toThrow()
  })

  it('falla si ENCRYPTION_KEY no está definida', () => {
    delete process.env.ENCRYPTION_KEY

    expect(() => encryptCredentials('test')).toThrow('ENCRYPTION_KEY')
  })

  it('isEncryptedCredentials rechaza objetos inválidos', () => {
    expect(isEncryptedCredentials(null)).toBe(false)
    expect(isEncryptedCredentials({})).toBe(false)
    expect(isEncryptedCredentials({ iv: 'x', tag: 'y' })).toBe(false)
    expect(isEncryptedCredentials('string')).toBe(false)
  })
})
