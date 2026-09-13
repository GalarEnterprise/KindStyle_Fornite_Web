/**
 * Temporary spike script - round 2: search for actual V-Bucks currency entries
 */
import { FortniteAPI } from '@yaelouuu/fortnite-api'

const apiKey = process.env.API_FORTNITE_API_KEY!
const client = new FortniteAPI({
  apiKey,
  baseUrl: process.env.API_FORNITE_URL || 'https://prod.api-fortnite.com/api',
})

async function main() {
  console.log('=== ROUND 2: Searching for V-Bucks currency entries ===\n')

  const shop = await client.shop.getCurrent({ lang: 'es' })

  // Search for entries where ANY itemGrant templateId contains Currency
  let currencyEntries: any[] = []
  let cosmeticEntriesWithCurrencyPrice = 0

  for (const storefront of shop.storefronts) {
    for (const entry of storefront.catalogEntries) {
      const hasCurrencyGrant = entry.itemGrants?.some((g: any) =>
        g.templateId?.toLowerCase().startsWith('currency:')
      )
      if (hasCurrencyGrant) {
        currencyEntries.push({ entry, storefront: storefront.name })
      }

      // Check entries with MtxCurrency price
      const mtxPrice = entry.prices?.find((p: any) => p.currencyType === 'MtxCurrency')
      if (mtxPrice && mtxPrice.finalPrice > 0) {
        cosmeticEntriesWithCurrencyPrice++
      }
    }
  }

  console.log(`Total entries: ${shop.storefronts.reduce((a, s) => a + s.catalogEntries.length, 0)}`)
  console.log(`Entries with Currency: templateId: ${currencyEntries.length}`)
  console.log(`Entries priced in MtxCurrency: ${cosmeticEntriesWithCurrencyPrice}`)

  if (currencyEntries.length > 0) {
    for (const { entry, storefront } of currencyEntries) {
      console.log(`\n--- Currency Entry (storefront: ${storefront}) ---`)
      console.log(`  title: ${entry.title}`)
      console.log(`  devName: ${entry.devName}`)
      console.log(`  offerVisual: ${entry.offerVisual || 'null'}`)
      console.log(`  displayAssetPath: ${entry.displayAssetPath || 'null'}`)
      for (const grant of entry.itemGrants || []) {
        console.log(`  templateId: ${grant.templateId}`)
        console.log(`  cosmetic: ${grant.cosmetic ? grant.cosmetic.name : 'NULL'}`)
      }
    }
  } else {
    console.log('\nNo entries with Currency: templateId found in shop.')
    console.log('V-Bucks products may not be sold in the shop, or may use a different templateId pattern.')

    // Try alternative detection: entries with very specific devName patterns
    console.log('\nSearching for entries with Mtx/VTX/devName patterns...')
    for (const storefront of shop.storefronts) {
      for (const entry of storefront.catalogEntries) {
        const devName = (entry.devName || '').toLowerCase()
        const title = (entry.title || '').toLowerCase()
        if (devName.includes('mtx') && !devName.includes('for')) {
          console.log(`\n--- Potential currency entry (devName) ---`)
          console.log(`  title: ${entry.title}`)
          console.log(`  devName: ${entry.devName}`)
          console.log(`  offerVisual: ${entry.offerVisual || 'null'}`)
          for (const grant of entry.itemGrants || []) {
            console.log(`  templateId: ${grant.templateId}`)
            console.log(`  cosmetic: ${grant.cosmetic ? grant.cosmetic.name : 'NULL'}`)
          }
        }
      }
    }
  }

  // Also check: what does a V-Bucks offer look like if it exists?
  console.log('\n--- ALL UNIQUE TEMPLATE PREFIXES ---')
  const prefixes = new Set<string>()
  for (const storefront of shop.storefronts) {
    for (const entry of storefront.catalogEntries) {
      for (const grant of entry.itemGrants || []) {
        const prefix = grant.templateId?.split(':')[0] || 'unknown'
        prefixes.add(prefix)
      }
    }
  }
  console.log([...prefixes].sort().join('\n'))
}

main()
