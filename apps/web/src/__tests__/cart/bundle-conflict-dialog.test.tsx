/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import type { BundleConflictPayload } from '@/hooks/use-cart'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))

const mockResolveConflict = vi.fn()
const mockAddBundleItem = vi.fn()
let cartItems: Array<Record<string, unknown>> = []

vi.mock('@/hooks/use-cart', () => ({
  useCart: () => ({
    items: cartItems,
    addBundleItem: mockAddBundleItem,
    resolveConflict: mockResolveConflict,
  }),
}))

import { BundleConflictDialog } from '@/components/cart/bundle-conflict-dialog'
import { BundleCard } from '@/components/shop/bundle-card'

const CONFLICT: BundleConflictPayload = {
  resolutionId: '423e4567-e89b-12d3-a456-426614174003',
  bundle: { offerId: 'v2:/bundle-1', name: 'Pack Completo', imageUrl: null, priceVbucks: 2500 },
  conflictingItems: [
    { cartItemId: 'ci-1', productId: 'p-1', name: 'Skin A', slug: 'skin-a' },
    { cartItemId: 'ci-2', productId: 'p-2', name: 'Skin B', slug: 'skin-b' },
  ],
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  cartItems = []
})

describe('BundleConflictDialog', () => {
  it('muestra el bundle y los artículos en conflicto con sus tres acciones', () => {
    render(
      <BundleConflictDialog
        conflict={CONFLICT}
        onKeepSeparate={vi.fn()}
        onReplaceWithBundle={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/Pack Completo/)).toBeTruthy()
    expect(screen.getByText('Skin A')).toBeTruthy()
    expect(screen.getByText('Skin B')).toBeTruthy()
    expect(screen.getByTestId('conflict-replace')).toBeTruthy()
    expect(screen.getByTestId('conflict-keep')).toBeTruthy()
    expect(screen.getByTestId('conflict-cancel')).toBeTruthy()
  })
})

describe('BundleCard — flujo de conflicto', () => {
  function renderCard() {
    return render(
      <BundleCard
        offerId="v2:/bundle-1"
        name="Pack Completo"
        imageUrl={null}
        priceVbucks={2500}
        components={['Skin A', 'Skin B']}
      />
    )
  }

  async function openConflict() {
    mockAddBundleItem.mockResolvedValue({ success: false, conflict: CONFLICT })
    renderCard()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Agregar/ }))
    })
    expect(screen.getByTestId('conflict-replace')).toBeTruthy()
  }

  it('muestra la advertencia y no presenta el bundle como agregado', async () => {
    mockAddBundleItem.mockResolvedValue({ success: false, conflict: CONFLICT })
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }))

    expect(await screen.findByTestId('conflict-cancel')).toBeTruthy()
    expect(screen.queryByText('✓ Agregado')).toBeNull()
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeTruthy()
  })

  it('cancelar no modifica el carrito: no solicita ninguna decisión', async () => {
    await openConflict()

    await act(async () => {
      fireEvent.click(screen.getByTestId('conflict-cancel'))
    })

    expect(mockResolveConflict).not.toHaveBeenCalled()
    expect(screen.queryByTestId('conflict-cancel')).toBeNull()
    expect(cartItems).toHaveLength(0)
  })

  it('conservar por separado solicita keep_separate al servidor', async () => {
    mockResolveConflict.mockResolvedValue({ success: true, status: 'kept_separate' })
    await openConflict()

    await act(async () => {
      fireEvent.click(screen.getByTestId('conflict-keep'))
    })

    expect(mockResolveConflict).toHaveBeenCalledWith(CONFLICT.resolutionId, 'keep_separate')
  })

  it('confirmar sustitución solicita replace_with_bundle y refleja la respuesta del servidor', async () => {
    mockResolveConflict.mockResolvedValue({ success: true, status: 'replaced_by_bundle' })
    await openConflict()

    await act(async () => {
      fireEvent.click(screen.getByTestId('conflict-replace'))
    })

    expect(mockResolveConflict).toHaveBeenCalledWith(CONFLICT.resolutionId, 'replace_with_bundle')
    expect(await screen.findByText('✓ Agregado')).toBeTruthy()
    expect(screen.queryByTestId('conflict-cancel')).toBeNull()
  })

  it('si el servidor rechaza la decisión, el diálogo muestra el error y no confirma', async () => {
    mockResolveConflict.mockResolvedValue({
      success: false,
      error: 'La confirmación expiró o ya fue usada. Vuelve a agregar el bundle.',
    })
    await openConflict()

    await act(async () => {
      fireEvent.click(screen.getByTestId('conflict-replace'))
    })

    expect(await screen.findByText(/expiró/)).toBeTruthy()
    expect(screen.queryByText('✓ Agregado')).toBeNull()
    expect(screen.getByTestId('conflict-cancel')).toBeTruthy()
  })
})
