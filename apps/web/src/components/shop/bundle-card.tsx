'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useCart, type BundleConflictPayload } from '@/hooks/use-cart'
import { BundleConflictDialog } from '@/components/cart/bundle-conflict-dialog'

interface BundleCardProps {
  offerId: string | null
  name: string
  imageUrl: string | null
  priceVbucks: number
  components: string[]
}

export function BundleCard({ offerId, name, imageUrl, priceVbucks, components }: BundleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<BundleConflictPayload | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const { isAuthenticated, isLoading } = useAuth()
  const { addBundleItem, resolveConflict, items } = useCart()
  const router = useRouter()

  const vbucksRate = 7.5
  const priceMxn = priceVbucks * (vbucksRate / 100)

  const isInCart = Boolean(offerId) && items.some((item) => item.bundleOfferId === offerId!)

  async function handleAdd() {
    setError(null)
    if (isLoading || isInCart) return
    if (!isAuthenticated) {
      router.push(offerId ? `/login?add=${encodeURIComponent(`bundle:${offerId}`)}` : '/login')
      return
    }
    if (!offerId) {
      setError('Este bundle no está disponible para agregar')
      return
    }

    setLoading(true)
    const result = await addBundleItem(offerId, 1)
    setLoading(false)

    if (result.conflict) {
      setConflictError(null)
      setConflict(result.conflict)
    } else if (result.success) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } else {
      setError(result.error ?? 'Error al agregar al carrito')
    }
  }

  async function handleDecision(decision: 'keep_separate' | 'replace_with_bundle') {
    if (!conflict) return
    setConflictLoading(true)
    const result = await resolveConflict(conflict.resolutionId, decision)
    setConflictLoading(false)

    if (!result.success) {
      setConflictError(result.error ?? 'No se pudo confirmar la decisión. Vuelve a intentarlo.')
      return
    }

    setConflict(null)
    if (decision === 'replace_with_bundle') {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-gray-900 border border-gray-700 transition-all hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

      <div className="aspect-square overflow-hidden bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-600">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
            BUNDLE
          </span>
        </div>

        <h3 className="text-sm font-semibold text-white truncate" title={name}>
          {name}
        </h3>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-yellow-400">
            {priceVbucks.toLocaleString('es-MX')} V
          </span>
        </div>

        <span className="mt-0.5 text-xs text-gray-400">
          ${priceMxn.toFixed(2)} MXN
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          <svg
            className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Incluye {components.length} {components.length === 1 ? 'artículo' : 'artículos'}
        </button>

        {expanded && (
          <ul className="mt-2 text-xs text-gray-300 space-y-1">
            {components.map((component, index) => (
              <li key={index} className="flex items-center gap-1">
                <span className="text-purple-400">•</span>
                {component}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      <button
        onClick={handleAdd}
        disabled={loading || isInCart || !offerId}
        className={`mx-3 mb-3 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          added || isInCart ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {isInCart ? '✓ En carrito' : added ? '✓ Agregado' : loading ? 'Agregando...' : 'Agregar'}
      </button>

      {conflict && (
        <BundleConflictDialog
          conflict={conflict}
          loading={conflictLoading}
          error={conflictError}
          onKeepSeparate={() => handleDecision('keep_separate')}
          onReplaceWithBundle={() => handleDecision('replace_with_bundle')}
          onCancel={() => {
            setConflict(null)
            setConflictError(null)
          }}
        />
      )}
    </div>
  )
}