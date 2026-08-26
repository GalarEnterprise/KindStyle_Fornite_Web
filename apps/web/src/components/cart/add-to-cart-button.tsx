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
}

export function AddToCartButton({ productId, productName, productType }: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const [showCredentials, setShowCredentials] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

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
      if (!showCredentials) {
        setShowCredentials(true)
      }
    }

    setLoading(false)
  }

  function handleClick() {
    if (!isAuthenticated) {
      router.push('/login')
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
        disabled={loading}
        className={`mx-3 mb-3 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          added ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {added ? (
          <>✓ Agregado</>
        ) : loading ? (
          <>Agregando...</>
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
