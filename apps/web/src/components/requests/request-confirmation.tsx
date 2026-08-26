'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { buildRequestMessage, buildWhatsappUrl } from '@/lib/services/requests/message-service'

interface RequestDetail {
  id: string
  requestNumber: string
  status: string
  totalVbucks: number
  totalMxn: number
  whatsappOpenedAt: string | null
  createdAt: string
  items: Array<{
    id: string
    productName: string
    sku: string
    priceVbucks: number
    quantity: number
  }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Creada', color: 'bg-gray-800 text-gray-300' },
  WHATSAPP_OPENED: { label: 'WhatsApp abierto', color: 'bg-blue-900/40 text-blue-400' },
  CONTACTED: { label: 'Contactado', color: 'bg-yellow-900/40 text-yellow-400' },
  PAID: { label: 'Pagado', color: 'bg-green-900/40 text-green-400' },
  FULFILLED: { label: 'Entregado', color: 'bg-green-700/40 text-green-300' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-900/40 text-red-400' },
}

export function RequestConfirmation() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('request')
  const { user } = useAuth()

  const [detail, setDetail] = useState<RequestDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!requestId) {
      setError('No se especificó ninguna solicitud')
      setIsLoading(false)
      return
    }

    async function load() {
      try {
        const res = await fetch(`/api/requests/${requestId}`)
        const data = await res.json()
        if (data.success) {
          setDetail(data.data)
        } else {
          setError(data.error?.message ?? 'Error al cargar la solicitud')
        }
      } catch {
        setError('Error de conexión')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [requestId])

  function getMessage(): string {
    if (!detail) return ''
    return buildRequestMessage({
      requestNumber: detail.requestNumber,
      nickname: user?.nickname ?? '',
      items: detail.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        priceVbucks: item.priceVbucks,
      })),
      totalVbucks: detail.totalVbucks,
      totalMxn: detail.totalMxn,
    })
  }

  async function handleOpenWhatsapp() {
    if (!detail) return

    try {
      await fetch(`/api/requests/${detail.id}/whatsapp-opened`, { method: 'POST' })
      setDetail((prev) =>
        prev ? { ...prev, status: prev.status === 'CREATED' ? 'WHATSAPP_OPENED' : prev.status } : prev
      )
    } catch {
    } finally {
      window.open(buildWhatsappUrl(getMessage()), '_blank', 'noopener,noreferrer')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getMessage())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-6">
          <div className="h-6 w-1/3 rounded bg-gray-800" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full rounded bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/shop" className="mt-4 inline-block text-sm text-purple-400 hover:underline">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const status = STATUS_LABELS[detail.status] ?? STATUS_LABELS.CREATED

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <h1 className="text-lg font-bold text-green-400">✓ Solicitud creada</h1>
        <p className="mt-1 text-sm text-gray-300">
          Envía tu solicitud al vendedor por WhatsApp para continuar con la compra.
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-sm font-bold text-white">{detail.requestNumber}</span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>

        <div className="mt-4 divide-y divide-gray-800">
          {detail.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span className="text-gray-300">
                {item.productName} <span className="text-gray-500">x{item.quantity}</span>
              </span>
              <span className="text-yellow-400">{(item.priceVbucks * item.quantity).toLocaleString('es-MX')} V</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-gray-800 pt-4">
          <span className="text-sm text-gray-400">Total estimado</span>
          <div className="text-right">
            <div className="font-bold text-yellow-400">{detail.totalVbucks.toLocaleString('es-MX')} V-Bucks</div>
            <div className="text-sm text-gray-400">≈ ${detail.totalMxn.toFixed(2)} MXN</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleOpenWhatsapp}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Abrir WhatsApp
        </button>

        <button
          onClick={handleCopy}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
            copied
              ? 'bg-green-600 text-white'
              : 'border border-gray-700 text-gray-200 hover:bg-gray-800'
          }`}
        >
          {copied ? '✓ Copiado' : 'Copiar solicitud'}
        </button>
      </div>

      <Link
        href="/account/requests"
        className="mt-6 block text-center text-sm text-purple-400 hover:underline"
      >
        Ver mis solicitudes
      </Link>
    </div>
  )
}
