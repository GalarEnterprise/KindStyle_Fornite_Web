import type { CatalogProvider, ProviderResult, NormalizedShop } from './types'
import { createHash } from 'crypto'

export class ShadowProvider implements CatalogProvider {
  name = 'shadow'
  version = '1.0.0'

  private primary: CatalogProvider
  private secondary: CatalogProvider

  constructor(primary: CatalogProvider, secondary: CatalogProvider) {
    this.primary = primary
    this.secondary = secondary
  }

  async fetchShop(): Promise<ProviderResult> {
    console.log(`[ShadowProvider] Running both providers in parallel`)
    console.log(`[ShadowProvider] Primary: ${this.primary.name}, Secondary: ${this.secondary.name}`)

    const [primaryResult, secondaryResult] = await Promise.allSettled([
      this.primary.fetchShop(),
      this.secondary.fetchShop(),
    ])

    const primary: ProviderResult = primaryResult.status === 'fulfilled' ? primaryResult.value : {
      success: false,
      error: {
        code: 'PROMISE_REJECTED',
        message: primaryResult.reason?.message || 'Promise rejected',
        provider: this.primary.name,
      },
    }

    const secondary: ProviderResult = secondaryResult.status === 'fulfilled' ? secondaryResult.value : {
      success: false,
      error: {
        code: 'PROMISE_REJECTED',
        message: secondaryResult.reason?.message || 'Promise rejected',
        provider: this.secondary.name,
      },
    }

    this.logComparison(primary, secondary)

    if (primary.success && primary.data) {
      return { success: true, data: primary.data }
    }

    if (secondary.success && secondary.data) {
      console.log(`[ShadowProvider] Primary failed, using secondary result`)
      return { success: true, data: secondary.data }
    }

    return {
      success: false,
      error: {
        code: 'BOTH_PROVIDERS_FAILED',
        message: `Primary (${this.primary.name}): ${primary.error?.message}. Secondary (${this.secondary.name}): ${secondary.error?.message}`,
        provider: 'shadow',
      },
    }
  }

  private logComparison(
    primary: ProviderResult,
    secondary: ProviderResult
  ): void {
    if (!primary.success || !secondary.success) {
      console.log(`[ShadowProvider] Comparison skipped - one or both providers failed`)
      return
    }

    if (!primary.data || !secondary.data) {
      console.log(`[ShadowProvider] Comparison skipped - missing data`)
      return
    }

    const primaryChecksum = primary.data.checksum
    const secondaryChecksum = secondary.data.checksum
    const primaryCount = primary.data.entries.length
    const secondaryCount = secondary.data.entries.length

    console.log(`[ShadowProvider] Primary (${primary.data.provider}): ${primaryCount} entries, checksum: ${primaryChecksum.substring(0, 8)}...`)
    console.log(`[ShadowProvider] Secondary (${secondary.data.provider}): ${secondaryCount} entries, checksum: ${secondaryChecksum.substring(0, 8)}...`)

    if (primaryChecksum === secondaryChecksum) {
      console.log(`[ShadowProvider] Checksums match - providers are in sync`)
    } else {
      console.warn(`[ShadowProvider] Checksums differ - providers may have different data`)
      this.logDifferences(primary.data, secondary.data)
    }

    if (primaryCount !== secondaryCount) {
      console.warn(`[ShadowProvider] Entry count differs: primary=${primaryCount}, secondary=${secondaryCount}`)
    }
  }

  private logDifferences(
    primary: NormalizedShop,
    secondary: NormalizedShop
  ): void {
    const primaryIds = new Set(primary.entries.map(e => e.fortniteProductId))
    const secondaryIds = new Set(secondary.entries.map(e => e.fortniteProductId))

    const onlyInPrimary = primary.entries.filter(e => !secondaryIds.has(e.fortniteProductId))
    const onlyInSecondary = secondary.entries.filter(e => !primaryIds.has(e.fortniteProductId))

    if (onlyInPrimary.length > 0) {
      console.warn(`[ShadowProvider] Only in primary (${onlyInPrimary.length}):`, onlyInPrimary.map(e => e.name).slice(0, 5))
    }

    if (onlyInSecondary.length > 0) {
      console.warn(`[ShadowProvider] Only in secondary (${onlyInSecondary.length}):`, onlyInSecondary.map(e => e.name).slice(0, 5))
    }

    const commonIds = primaryIds.size > secondaryIds.size
      ? Array.from(primaryIds).filter(id => secondaryIds.has(id))
      : Array.from(secondaryIds).filter(id => primaryIds.has(id))

    const priceDifferences: Array<{ name: string; primaryPrice: number; secondaryPrice: number }> = []

    for (const id of commonIds.slice(0, 100)) {
      const primaryEntry = primary.entries.find(e => e.fortniteProductId === id)
      const secondaryEntry = secondary.entries.find(e => e.fortniteProductId === id)

      if (primaryEntry && secondaryEntry && primaryEntry.priceVbucks !== secondaryEntry.priceVbucks) {
        priceDifferences.push({
          name: primaryEntry.name,
          primaryPrice: primaryEntry.priceVbucks,
          secondaryPrice: secondaryEntry.priceVbucks,
        })
      }
    }

    if (priceDifferences.length > 0) {
      console.warn(`[ShadowProvider] Price differences found:`, priceDifferences.slice(0, 5))
    }
  }
}