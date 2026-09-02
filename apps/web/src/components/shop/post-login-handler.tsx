'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { parseAddIntent } from '@/lib/utils/add-intent'
import { ValidatedBanner } from '@/components/ui/validated-banner'

export function PostLoginHandler() {
  const { addItem, addBundleItem } = useCart()
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return

    const params = new URLSearchParams(window.location.search)
    const hasValidated = params.has('validated')
    const intent = parseAddIntent(params.get('add'))

    if (!hasValidated && !intent) return

    processed.current = true
    if (hasValidated) setShowSuccess(true)

    async function handle() {
      if (intent?.type === 'productId') {
        const result = await addItem(intent.value)
        if (!result.success) {
          setError(result.error ?? 'No se pudo agregar el artículo al carrito')
        }
      } else if (intent?.type === 'bundle') {
        const result = await addBundleItem(intent.value)
        if (!result.success) {
          setError(result.error ?? 'No se pudo agregar el bundle al carrito')
        }
      }

      params.delete('validated')
      params.delete('add')
      const query = params.toString() ? `?${params.toString()}` : ''
      window.history.replaceState(null, '', window.location.pathname + query)
    }

    handle()
  }, [addItem, addBundleItem])

  useEffect(() => {
    if (!showSuccess) return
    const timeout = setTimeout(() => setShowSuccess(false), 3000)
    return () => clearTimeout(timeout)
  }, [showSuccess])

  useEffect(() => {
    if (!error) return
    const timeout = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timeout)
  }, [error])

  if (!showSuccess && !error) return null

  return (
    <>
      {showSuccess && <ValidatedBanner />}
      {error && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-16">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 shadow-lg">
            <svg
              className="h-4 w-4 shrink-0 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v4m0 4h.01M10.29 3.86l-8.29 15.2a1 1 0 00.87 1.46h16.26a1 1 0 00.87-1.46L13.71 3.86a1 1 0 00-1.74 0z"
              />
            </svg>
            <span className="text-sm font-medium text-red-300">{error}</span>
          </div>
        </div>
      )}
    </>
  )
}