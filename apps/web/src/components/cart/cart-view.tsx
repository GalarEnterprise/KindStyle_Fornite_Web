'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart, type CartItem } from '@/hooks/use-cart'
import { CredentialsModal } from '@/components/cart/credentials-modal'
import { PAYMENT_METHODS } from '@/lib/config/payment-info'

const TYPE_LABELS: Record<string, string> = {
  GIFT: 'Regalo',
  VBucks: 'V-Bucks',
  CREW: 'Crew',
  BATTLE_PASS: 'Pase de Batalla',
  BUNDLE: 'Bundle',
}

export function CartView() {
  const { items, isLoading, updateItem, removeItem, refresh } = useCart()
  const router = useRouter()
  const [editingCredentials, setEditingCredentials] = useState<CartItem | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingRequest, setCreatingRequest] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'OXXO'>('TRANSFER')

  async function handleCreateRequest() {
    setCreatingRequest(true)
    setRequestError(null)

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      })
      const data = await res.json()

      if (!data.success) {
        setRequestError(data.error?.message ?? 'Error al crear la solicitud')
        return
      }

      await refresh()
      router.push(`/account/checkout?request=${data.data.id}`)
    } catch {
      setRequestError('Error de conexión')
    } finally {
      setCreatingRequest(false)
    }
  }

  const SPECIAL_TYPES = ['VBucks', 'CREW', 'BATTLE_PASS']
  const itemPriceVbucks = (item: CartItem) =>
    item.type === 'BUNDLE' ? (item.bundlePriceVbucks ?? 0) : (item.product?.priceVbucks ?? 0)
  const itemPriceMxn = (item: CartItem) =>
    item.type === 'BUNDLE'
      ? (item.bundlePriceVbucks ?? 0) * 0.075
      : ((item.product?.adminPriceMxn ?? (item.product?.priceVbucks ?? 0) * 0.075) as number)
  const totalMxn = items.reduce((acc, item) => acc + itemPriceMxn(item) * item.quantity, 0)
  const totalVbucks = items.reduce((acc, item) => acc + itemPriceVbucks(item) * item.quantity, 0)

  async function handleQuantity(item: CartItem, delta: number) {
    const next = Math.min(10, Math.max(1, item.quantity + delta))
    if (next === item.quantity) return
    await updateItem(item.id, { quantity: next })
  }

  async function handleCredentialsSubmit(credentials: { epicEmail: string; epicPassword: string }) {
    if (!editingCredentials) return
    setSaving(true)
    setUpdateError(null)

    const result = await updateItem(editingCredentials.id, { credentials })

    if (!result.success) {
      setUpdateError(result.error ?? 'Error al actualizar credenciales')
    } else {
      setEditingCredentials(null)
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="h-20 w-20 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-gray-800" />
                <div className="h-3 w-1/4 rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h1 className="mt-4 text-xl font-bold text-white">Tu carrito está vacío</h1>
        <p className="mt-1 text-sm text-gray-400">Explora la tienda y agrega tus productos favoritos.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Tu carrito</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center"
          >
<div className="flex flex-1 items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                  {item.type === 'BUNDLE'
                    ? (item.product?.imageUrl ?? item.product?.iconUrl) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product?.imageUrl ?? item.product?.iconUrl ?? ''}
                          alt={item.bundleName ?? 'Bundle'}
                          className="h-full w-full object-cover"
                        />
                      )
                    : (item.product?.imageUrl || item.product?.iconUrl) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product?.imageUrl ?? item.product?.iconUrl ?? ''}
                          alt={item.product?.name ?? ''}
                          className="h-full w-full object-cover"
                        />
                      )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-white">
                    {item.type === 'BUNDLE' ? (item.bundleName ?? 'Bundle') : (item.product?.name ?? '')}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="font-bold text-yellow-400">
                      {itemPriceVbucks(item).toLocaleString('es-MX')} V-Bucks
                    </span>
                    <span className="text-gray-400">
                      ${itemPriceMxn(item).toFixed(2)} MXN c/u
                    </span>
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-300">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    {item.type === 'BUNDLE' && (
                      <span className="rounded-full bg-purple-900/40 px-2 py-0.5 text-purple-400">
                        Paquete completo
                      </span>
                    )}
                    {item.product?.giftable === 'GIFTABLE' && (
                      <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-green-400">Regalable</span>
                    )}
                  </div>
                  {item.type === 'BUNDLE' && (item.bundleComponents?.length ?? 0) > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-gray-400">
                      {item.bundleComponents!.map((component, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="text-purple-400">•</span>
                          {component.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {SPECIAL_TYPES.includes(item.type) && (
                    <button
                      onClick={() => {
                        setUpdateError(null)
                        setEditingCredentials(item)
                      }}
                      className="mt-1 text-xs text-purple-400 underline-offset-2 hover:underline"
                    >
                      Editar credenciales de Epic
                    </button>
                  )}
                </div>
              </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border border-gray-700">
                <button
                  onClick={() => handleQuantity(item, -1)}
                  disabled={item.quantity <= 1}
                  className="px-2.5 py-1 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                <button
                  onClick={() => handleQuantity(item, 1)}
                  disabled={item.quantity >= 10}
                  className="px-2.5 py-1 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="rounded-md p-1.5 text-gray-500 transition hover:bg-red-900/20 hover:text-red-400"
                aria-label={`Remover ${item.type === 'BUNDLE' ? (item.bundleName ?? 'Bundle') : (item.product?.name ?? '')}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Total V-Bucks</span>
          <span className="font-bold text-yellow-400">{totalVbucks.toLocaleString('es-MX')} V</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-sm text-gray-400">Total estimado</span>
          <span className="text-lg font-bold text-white">${totalMxn.toFixed(2)} MXN</span>
        </div>

        <div className="mt-4 border-t border-gray-800 pt-4">
          <p className="mb-2 text-sm font-medium text-gray-300">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                  paymentMethod === method.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <span className="text-xl">{method.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{method.label}</p>
                  <p className="text-xs text-gray-400">{method.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {requestError && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {requestError}
          </div>
        )}

        <button
          onClick={handleCreateRequest}
          disabled={creatingRequest || items.length === 0}
          className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creatingRequest ? 'Creando solicitud...' : 'Solicitar productos'}
        </button>
      </div>

      <CredentialsModal
        open={!!editingCredentials}
        productName={editingCredentials?.product?.name ?? ''}
        loading={saving}
        error={updateError}
        onSubmit={handleCredentialsSubmit}
        onCancel={() => {
          setEditingCredentials(null)
          setUpdateError(null)
        }}
      />
    </div>
  )
}
