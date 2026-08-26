'use client'

import Link from 'next/link'
import { useRequests } from '@/hooks/use-requests'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Creada', color: 'bg-gray-800 text-gray-300' },
  WHATSAPP_OPENED: { label: 'WhatsApp abierto', color: 'bg-blue-900/40 text-blue-400' },
  CONTACTED: { label: 'Contactado', color: 'bg-yellow-900/40 text-yellow-400' },
  UNDER_REVIEW: { label: 'En revisión', color: 'bg-yellow-900/40 text-yellow-400' },
  PRICE_CONFIRMED: { label: 'Precio confirmado', color: 'bg-blue-900/40 text-blue-400' },
  PAYMENT_PENDING: { label: 'Pago pendiente', color: 'bg-orange-900/40 text-orange-400' },
  PAID: { label: 'Pagado', color: 'bg-green-900/40 text-green-400' },
  FULFILLMENT_PENDING: { label: 'Entrega pendiente', color: 'bg-purple-900/40 text-purple-400' },
  FULFILLED: { label: 'Entregado', color: 'bg-green-700/40 text-green-300' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-900/40 text-red-400' },
  EXPIRED: { label: 'Expirada', color: 'bg-gray-800 text-gray-500' },
}

export function RequestList() {
  const { requests, isLoading } = useRequests()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-gray-800 bg-gray-900" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">No tienes solicitudes todavía.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const status = STATUS_LABELS[request.status] ?? STATUS_LABELS.CREATED
        return (
          <Link
            key={request.id}
            href={`/account/checkout?request=${request.id}`}
            className="block rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-purple-500"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-white">{request.requestNumber}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-gray-400">
                {new Date(request.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="font-semibold text-yellow-400">
                {request.totalVbucks.toLocaleString('es-MX')} V · ≈ ${Number(request.totalMxn).toFixed(2)} MXN
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
