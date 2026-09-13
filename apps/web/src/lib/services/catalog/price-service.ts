import { db } from '@/lib/db/client'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let cachedRate: number | null = null
let cacheTimestamp: number = 0

const DEFAULT_VBUCKS_RATE = 7.5

export async function getVbucksRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRate
  }

  try {
    const setting = await db.currencySetting.findFirst({
      select: { vbucks_rate_mxn: true },
      orderBy: { updated_at: 'desc' },
    })

    if (setting) {
      cachedRate = Number(setting.vbucks_rate_mxn)
      cacheTimestamp = now
      return cachedRate
    }
  } catch (error) {
    console.error('[price-service] Error fetching CurrencySetting:', error)
  }

  cachedRate = DEFAULT_VBUCKS_RATE
  cacheTimestamp = now
  return DEFAULT_VBUCKS_RATE
}

export async function calculatePriceMxn(priceVbucks: number): Promise<number> {
  const rate = await getVbucksRate()
  return (priceVbucks * rate) / 100
}

export function resetCache(): void {
  cachedRate = null
  cacheTimestamp = 0
}
