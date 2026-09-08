/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))

vi.mock('@/hooks/use-cart', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    addBundleItem: vi.fn(),
  }),
}))

import { SpecialProductCard } from '@/components/shop/special-product-card'
import { SpecialSectionHeader } from '@/components/shop/special-section-header'

beforeEach(() => {
  cleanup()
})

describe('SpecialProductCard', () => {
  it('renders product name and prices', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="1000 V-Bucks"
        priceVbucks={1000}
        priceMxn={75}
        imageUrl="https://example.com/image.png"
        iconUrl={null}
        type="VBucks"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="VBucks"
      />
    )

    expect(screen.getByText('1000 V-Bucks')).toBeTruthy()
    expect(screen.getByText('1,000 V')).toBeTruthy()
    expect(screen.getByText('$75.00 MXN')).toBeTruthy()
  })

  it('renders V-Bucks badge', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="1000 V-Bucks"
        priceVbucks={1000}
        priceMxn={75}
        imageUrl={null}
        iconUrl={null}
        type="VBucks"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="VBucks"
      />
    )

    expect(screen.getByText('V-Bucks')).toBeTruthy()
  })

  it('renders Battle Pass badge', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="Season Pass"
        priceVbucks={950}
        priceMxn={71.25}
        imageUrl={null}
        iconUrl={null}
        type="BATTLE_PASS"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="BATTLE_PASS"
      />
    )

    expect(screen.getByText('Pase')).toBeTruthy()
  })

  it('renders Crew badge', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="Fortnite Crew"
        priceVbucks={1200}
        priceMxn={90}
        imageUrl={null}
        iconUrl={null}
        type="CREW"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="CREW"
      />
    )

    expect(screen.getByText('Crew')).toBeTruthy()
  })

  it('renders credential notice', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="1000 V-Bucks"
        priceVbucks={1000}
        priceMxn={75}
        imageUrl={null}
        iconUrl={null}
        type="VBucks"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="VBucks"
      />
    )

    expect(screen.getByText('Requiere credenciales de Epic Games')).toBeTruthy()
  })

  it('renders image when provided', () => {
    render(
      <SpecialProductCard
        productId="prod-1"
        name="1000 V-Bucks"
        priceVbucks={1000}
        priceMxn={75}
        imageUrl="https://example.com/vbucks.png"
        iconUrl={null}
        type="VBucks"
        giftable="NOT_GIFTABLE"
        visible={true}
        specialType="VBucks"
      />
    )

    const img = screen.getByRole('img', { name: '1000 V-Bucks' })
    expect(img.getAttribute('src')).toBe('https://example.com/vbucks.png')
  })
})

describe('SpecialSectionHeader', () => {
  it('renders title and entry count', () => {
    render(
      <SpecialSectionHeader
        title="V-Bucks"
        entryCount={3}
        specialType="VBucks"
      />
    )

    expect(screen.getByText('V-Bucks')).toBeTruthy()
    expect(screen.getByText('(3)')).toBeTruthy()
  })

  it('renders credential notice', () => {
    render(
      <SpecialSectionHeader
        title="V-Bucks"
        entryCount={3}
        specialType="VBucks"
      />
    )

    expect(screen.getByText('Requiere cuenta de Epic Games')).toBeTruthy()
  })

  it('renders Battle Pass header with correct styling', () => {
    const { container } = render(
      <SpecialSectionHeader
        title="Pase de Batalla"
        entryCount={1}
        specialType="BATTLE_PASS"
      />
    )

    expect(screen.getByText('Pase de Batalla')).toBeTruthy()
    const bannerEl = container.querySelector('.section-banner')
    expect(bannerEl?.className).toContain('from-blue-600')
  })

  it('renders Crew header with correct styling', () => {
    const { container } = render(
      <SpecialSectionHeader
        title="Fortnite Crew"
        entryCount={2}
        specialType="CREW"
      />
    )

    expect(screen.getByText('Fortnite Crew')).toBeTruthy()
    const bannerEl = container.querySelector('.section-banner')
    expect(bannerEl?.className).toContain('from-purple-600')
  })
})
