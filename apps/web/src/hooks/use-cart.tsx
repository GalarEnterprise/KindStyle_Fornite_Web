'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface CartProduct {
  id: string
  name: string
  slug: string
  type: string
  priceVbucks: number
  adminPriceMxn: number | null
  imageUrl: string | null
  iconUrl: string | null
  giftable: string
}

export interface CartBundleComponent {
  productId: string
  name: string
  slug: string
}

export interface CartItem {
  id: string
  productId: string | null
  quantity: number
  type: string
  createdAt: string
  bundleOfferId: string | null
  bundleName: string | null
  bundlePriceVbucks: number | null
  bundleComponents: CartBundleComponent[] | null
  product: CartProduct | null
}

export interface CredentialsPayload {
  epicEmail: string
  epicPassword: string
}

export interface CartConflictItemInfo {
  cartItemId: string
  productId: string
  name: string
  slug: string
}

export interface BundleConflictPayload {
  resolutionId: string
  bundle: {
    offerId: string
    name: string
    imageUrl: string | null
    priceVbucks: number
  }
  conflictingItems: CartConflictItemInfo[]
}

export type CartConflictDecision = 'keep_separate' | 'replace_with_bundle'

export interface AddBundleResult {
  success: boolean
  error?: string
  conflict?: BundleConflictPayload
}

interface CartContextType {
  items: CartItem[]
  count: number
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  addItem: (productId: string, quantity?: number, credentials?: CredentialsPayload) => Promise<{ success: boolean; error?: string }>
  addBundleItem: (offerId: string, quantity?: number) => Promise<AddBundleResult>
  resolveConflict: (
    resolutionId: string,
    decision: CartConflictDecision
  ) => Promise<{ success: boolean; status?: 'kept_separate' | 'replaced_by_bundle'; error?: string }>
  updateItem: (itemId: string, input: { quantity?: number; credentials?: CredentialsPayload }) => Promise<{ success: boolean; error?: string }>
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  isLoading: true,
  isAuthenticated: false,
  refresh: async () => {},
  addItem: async () => ({ success: false }),
  addBundleItem: async () => ({ success: false }),
  resolveConflict: async () => ({ success: false }),
  updateItem: async () => ({ success: false }),
  removeItem: async () => ({ success: false }),
})

const LOCALSTORAGE_KEY = 'kindstyle_cart_cache'
const MAX_QUANTITY = 10

function readLocalCache(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCALSTORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function writeLocalCache(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function CartProvider({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode
  isAuthenticated: boolean
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      writeLocalCache([])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data)
        writeLocalCache(data.data)
      }
    } catch {} finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    setItems(readLocalCache())
    refresh()
  }, [refresh])

  const addItem = useCallback(
    async (productId: string, quantity = 1, credentials?: CredentialsPayload) => {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity, credentials }),
        })
        const data = await res.json()

        if (!data.success) {
          return { success: false, error: data.error?.message ?? 'Error al agregar al carrito' }
        }

        await refresh()
        return { success: true }
      } catch {
        return { success: false, error: 'Error de conexión' }
      }
    },
    [refresh]
  )

  const addBundleItem = useCallback(
    async (offerId: string, quantity = 1): Promise<AddBundleResult> => {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId, quantity }),
        })
        const data = await res.json()

        if (!data.success) {
          return { success: false, error: data.error?.message ?? 'Error al agregar el bundle al carrito' }
        }

        if (data.data?.status === 'pending_resolution') {
          return { success: false, conflict: data.data as BundleConflictPayload }
        }

        await refresh()
        return { success: true }
      } catch {
        return { success: false, error: 'Error de conexión' }
      }
    },
    [refresh]
  )

  const resolveConflict = useCallback(
    async (resolutionId: string, decision: CartConflictDecision) => {
      try {
        const res = await fetch('/api/cart/resolve-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolutionId, decision }),
        })
        const data = await res.json()

        if (!data.success) {
          return { success: false, error: data.error?.message ?? 'No se pudo confirmar la decisión' }
        }

        await refresh()
        return { success: true, status: data.data?.status }
      } catch {
        return { success: false, error: 'Error de conexión' }
      }
    },
    [refresh]
  )

  const updateItem = useCallback(
    async (itemId: string, input: { quantity?: number; credentials?: CredentialsPayload }) => {
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const data = await res.json()

        if (!data.success) {
          return { success: false, error: data.error?.message ?? 'Error al actualizar' }
        }

        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.min(input.quantity ?? item.quantity, MAX_QUANTITY) } : item
          )
        )
        return { success: true }
      } catch {
        return { success: false, error: 'Error de conexión' }
      }
    },
    []
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
        const data = await res.json()

        if (!data.success) {
          return { success: false, error: data.error?.message ?? 'Error al remover' }
        }

        setItems((prev) => {
          const next = prev.filter((item) => item.id !== itemId)
          writeLocalCache(next)
          return next
        })
        return { success: true }
      } catch {
        return { success: false, error: 'Error de conexión' }
      }
    },
    []
  )

  const count = items.length

  return (
    <CartContext.Provider
      value={{ items, count, isLoading, isAuthenticated, refresh, addItem, addBundleItem, resolveConflict, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
