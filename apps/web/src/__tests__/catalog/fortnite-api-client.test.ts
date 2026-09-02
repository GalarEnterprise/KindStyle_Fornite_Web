import { describe, it, expect, vi, afterEach } from 'vitest'
import { FortniteApiClient, FortniteApiError } from '@/lib/services/catalog/fortnite-api'

function createClient() {
  return new FortniteApiClient({ apiKey: 'test-key', timeout: 50 })
}

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FortniteApiClient.getBannerColors', () => {
  it('fetches /v1/banners/colors and returns the payload', async () => {
    const payload = {
      status: 200,
      data: [{ id: 'DefaultColor1', color: 'Gray666666FF', category: 'DefaultColorSet1', subCategoryGroup: 0 }],
    }
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createClient().getBannerColors()

    expect(result).toEqual(payload)
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(calledUrl.pathname).toBe('/v1/banners/colors')
    expect(calledUrl.origin).toBe('https://fortnite-api.com')
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: 'test-key' })
  })
})

describe('FortniteApiClient.getBanners', () => {
  it('fetches /v1/banners with language param', async () => {
    const payload = {
      status: 200,
      data: [
        {
          id: 'AchievementGoGnome',
          devName: 'GoGnome',
          name: 'Estandarte de la base',
          description: 'Un nuevo estandarte',
          category: 'Special',
          images: { smallIcon: 'https://fortnite-api.com/images/banners/a/smallicon.png', icon: 'https://fortnite-api.com/images/banners/a/icon.png' },
        },
      ],
    }
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createClient().getBanners('es')

    expect(result.data[0].name).toBe('Estandarte de la base')
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(calledUrl.pathname).toBe('/v1/banners')
    expect(calledUrl.searchParams.get('language')).toBe('es')
  })

  it('throws FortniteApiError with status on 5xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(null, false, 502, 'Bad Gateway')))

    await expect(createClient().getBanners()).rejects.toMatchObject({
      name: 'FortniteApiError',
      statusCode: 502,
    })
  })

  it('throws FortniteApiError when API body signals error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ status: 404, error: 'not found' })))

    await expect(createClient().getBanners()).rejects.toBeInstanceOf(FortniteApiError)
  })

  it('maps AbortError to timeout error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      })
    )

    await expect(createClient().getBannerColors()).rejects.toThrow(/timeout/i)
  })

  it('maps network failures to FortniteApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up')
      })
    )

    await expect(createClient().getBannerColors()).rejects.toThrow(/Network error/)
  })
})
