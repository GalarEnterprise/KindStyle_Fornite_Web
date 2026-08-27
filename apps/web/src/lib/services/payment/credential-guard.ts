import { db } from '@/lib/db/client'
import { decryptCredentials, isEncryptedCredentials } from '@/lib/services/cart/crypto-service'

export async function canAccessCredentials(requestId: string): Promise<boolean> {
  const payment = await db.payment.findFirst({
    where: { request_id: requestId, status: 'VALIDATED' },
  })

  return payment !== null
}

export async function getDecryptedCredentials(
  requestId: string,
  encryptedCredentials: unknown
): Promise<string | null> {
  const hasAccess = await canAccessCredentials(requestId)

  if (!hasAccess) {
    return null
  }

  if (!isEncryptedCredentials(encryptedCredentials)) {
    return null
  }

  try {
    return decryptCredentials(encryptedCredentials)
  } catch {
    return null
  }
}
