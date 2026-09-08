'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useCart, type CredentialsPayload } from '@/hooks/use-cart'
import { CredentialsModal } from '@/components/cart/credentials-modal'

const SPECIAL_TYPES = ['VBucks', 'CREW', 'BATTLE_PASS']

interface AddToCartButtonProps {
  productId: string
  productName: string
  productType: string
  giftable: string
}

export function AddToCartButton({ productId, productName, productType, giftable }: AddToCartButtonProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { addItem, items } = useCart()
  const router = useRouter()

  const [showCredentials, setShowCredentials] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  const isInCart = items.some((item) => item.type !== 'BUNDLE' && item.productId === productId)
  const isNotGiftable = giftable === 'NOT_GIFTABLE'

  async function doAdd(credentials?: CredentialsPayload) {
    setLoading(true)
    setModalError(null)

    const result = await addItem(productId, 1, credentials)

    if (result.success) {
      setShowCredentials(false)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } else {
      setModalError(result.error ?? 'Error al agregar al carrito')
      if (!showCredentials && SPECIAL_TYPES.includes(productType)) {
        setShowCredentials(true)
      }
    }

    setLoading(false)
  }

  function handleClick() {
    if (isLoading || isInCart) return
    if (!isAuthenticated) {
      if (SPECIAL_TYPES.includes(productType)) {
        router.push('/login')
      } else {
        router.push(`/login?add=${encodeURIComponent(`productId:${productId}`)}`)
      }
      return
    }
    if (SPECIAL_TYPES.includes(productType)) {
      setShowCredentials(true)
      return
    }
    doAdd()
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || isInCart}
        className={`mx-3 mb-3 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          added || isInCart ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {added ? (
          <>✓ Agregado</>
        ) : isInCart ? (
          <>✓ En carrito</>
        ) : loading ? (
          <>Agregando...</>
        ) : isNotGiftable ? (
          <>
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Comprar
          </>
        ) : (
          <>
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar
          </>
        )}
      </button>

      <CredentialsModal
        open={showCredentials}
        productName={productName}
        loading={loading}
        error={modalError}
        onSubmit={(credentials) => doAdd(credentials)}
        onCancel={() => {
          setShowCredentials(false)
          setModalError(null)
        }}
      />
    </>
  )
}
