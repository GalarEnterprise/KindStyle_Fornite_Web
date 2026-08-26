import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32

interface EncryptedCredentials {
  iv: string
  tag: string
  data: string
}

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) {
    throw new Error('ENCRYPTION_KEY no está definida en las variables de entorno')
  }

  return scryptSync(secret, 'kindstyle-cart-credentials', KEY_LENGTH)
}

export function encryptCredentials(plain: string): EncryptedCredentials {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  }
}

export function decryptCredentials(encrypted: EncryptedCredentials): string {
  const key = getKey()

  try {
    const iv = Buffer.from(encrypted.iv, 'base64')
    const tag = Buffer.from(encrypted.tag, 'base64')
    const data = Buffer.from(encrypted.data, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    throw new Error('No se pudieron desencriptar las credenciales: datos corruptos o clave incorrecta')
  }
}

export function isEncryptedCredentials(value: unknown): value is EncryptedCredentials {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.iv === 'string' && typeof v.tag === 'string' && typeof v.data === 'string'
}
