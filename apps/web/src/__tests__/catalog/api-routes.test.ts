import { describe, it, expect } from 'vitest'
import { ProductsQuerySchema, SearchQuerySchema } from '@/lib/validators/catalog'

describe('ProductsQuerySchema', () => {
  it('validates valid query params', () => {
    const result = ProductsQuerySchema.safeParse({
      page: '1',
      perPage: '20',
      type: 'OUTFIT',
      rarity: 'EPIC',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.perPage).toBe(20)
      expect(result.data.type).toBe('OUTFIT')
      expect(result.data.rarity).toBe('EPIC')
    }
  })

  it('applies defaults', () => {
    const result = ProductsQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.perPage).toBe(20)
    }
  })

  it('rejects invalid page', () => {
    const result = ProductsQuerySchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects perPage over 100', () => {
    const result = ProductsQuerySchema.safeParse({ perPage: '101' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown product type', () => {
    const result = ProductsQuerySchema.safeParse({ type: 'INVALID_TYPE' })
    expect(result.success).toBe(false)
  })

  it('validates price range', () => {
    const result = ProductsQuerySchema.safeParse({
      minPrice: '100',
      maxPrice: '2000',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.minPrice).toBe(100)
      expect(result.data.maxPrice).toBe(2000)
    }
  })
})

describe('SearchQuerySchema', () => {
  it('validates valid search query', () => {
    const result = SearchQuerySchema.safeParse({ q: 'spider' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe('spider')
      expect(result.data.page).toBe(1)
    }
  })

  it('rejects empty query', () => {
    const result = SearchQuerySchema.safeParse({ q: '' })
    expect(result.success).toBe(false)
  })

  it('rejects query over 100 chars', () => {
    const result = SearchQuerySchema.safeParse({ q: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts paginated search', () => {
    const result = SearchQuerySchema.safeParse({ q: 'batman', page: '3', perPage: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.perPage).toBe(10)
    }
  })
})

describe('FortniteApiError class', () => {
  it('creates error with status code', async () => {
    const { FortniteApiError } = await import('@/lib/services/catalog/fortnite-api')

    const error = new FortniteApiError('Not Found', 404, 'https://example.com')
    expect(error.message).toBe('Not Found')
    expect(error.statusCode).toBe(404)
    expect(error.url).toBe('https://example.com')
    expect(error.name).toBe('FortniteApiError')
  })
})

describe('FortniteApiClient', () => {
  it('requires API key', async () => {
    const { FortniteApiClient } = await import('@/lib/services/catalog/fortnite-api')

    expect(() => new FortniteApiClient({ apiKey: '' })).toThrow('FORTNITE_API_KEY is required')
  })

  it('creates client with config', async () => {
    const { FortniteApiClient } = await import('@/lib/services/catalog/fortnite-api')

    const client = new FortniteApiClient({
      apiKey: 'test-key',
      baseUrl: 'https://custom-api.com',
      timeout: 5000,
      language: 'en',
    })

    expect(client).toBeDefined()
  })
})
