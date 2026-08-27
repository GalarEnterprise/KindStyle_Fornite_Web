'use client'

import { useState, useEffect, useCallback } from 'react'

interface PaymentUser {
  id: string
  nickname: string | null
  email: string
}

interface PaymentRequest {
  id: string
  request_number: string
  user: PaymentUser
  items: Array<{
    id: string
    product_name_snapshot: string
    price_vbucks_snapshot: number
    quantity: number
  }>
}

interface Payment {
  id: string
  method: string
  amount: string
  status: string
  receipt_file_url: string | null
  receipt_file_name: string | null
  admin_notes: string | null
  created_at: string
  request: PaymentRequest
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  const fetchPayments = useCallback(async () => {
    try {
      const url = filter ? `/api/admin/payments?status=${filter}` : '/api/admin/payments'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setPayments(data.data)
      } else {
        setError(data.error?.message ?? 'Error al cargar pagos')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse text-gray-400">Cargando pagos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-white">Gestión de Pagos</h1>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === ''
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('VALIDATION_IN_PROGRESS')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'VALIDATION_IN_PROGRESS'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('VALIDATED')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'VALIDATED'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Validados
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'REJECTED'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Rechazados
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {payments.length === 0 ? (
            <div className="text-center text-gray-400">No hay pagos</div>
          ) : (
            payments.map((payment) => (
              <AdminPaymentCard key={payment.id} payment={payment} onComplete={fetchPayments} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AdminPaymentCard({ payment, onComplete }: { payment: Payment; onComplete: () => void }) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleValidate() {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/validate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        onComplete()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject(reason: string) {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (data.success) {
        setShowRejectModal(false)
        onComplete()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">
            {payment.request.request_number}
          </span>
          <span className="ml-3 text-sm text-gray-400">
            {payment.request.user.nickname ?? payment.request.user.email}
          </span>
        </div>
        <span className={`text-sm font-medium ${getStatusColor(payment.status)}`}>
          {getStatusText(payment.status)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {payment.request.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-400">
            <span>{item.product_name_snapshot}</span>
            <span>{item.price_vbucks_snapshot} V-Bucks x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-800 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Total</span>
          <span className="text-lg font-bold text-white">
            ${Number(payment.amount).toFixed(2)} MXN
          </span>
        </div>
      </div>

      {payment.receipt_file_url && (
        <div className="mt-4">
          <a
            href={payment.receipt_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:underline"
          >
            Ver comprobante ({payment.receipt_file_name})
          </a>
        </div>
      )}

      {payment.status === 'VALIDATION_IN_PROGRESS' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleValidate}
            disabled={isProcessing}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
          >
            VALIDAR
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isProcessing}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            RECHAZAR
          </button>
        </div>
      )}

      {payment.admin_notes && (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-800/50 p-3">
          <span className="text-xs text-gray-400">Motivo de rechazo:</span>
          <p className="mt-1 text-sm text-gray-300">{payment.admin_notes}</p>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          onReject={handleReject}
          onClose={() => setShowRejectModal(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}

function RejectModal({
  onReject,
  onClose,
  isProcessing,
}: {
  onReject: (reason: string) => void
  onClose: () => void
  isProcessing: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">Rechazar Pago</h3>
        <p className="mt-2 text-sm text-gray-400">
          Ingresa el motivo del rechazo:
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          rows={3}
          placeholder="Motivo del rechazo..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => onReject(reason)}
            disabled={isProcessing || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {isProcessing ? 'Procesando...' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING_RECEIPT':
      return 'text-yellow-400'
    case 'VALIDATION_IN_PROGRESS':
      return 'text-blue-400'
    case 'VALIDATED':
      return 'text-green-400'
    case 'REJECTED':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'PENDING_RECEIPT':
      return 'Pendiente de comprobante'
    case 'VALIDATION_IN_PROGRESS':
      return 'En revisión'
    case 'VALIDATED':
      return 'Validado'
    case 'REJECTED':
      return 'Rechazado'
    default:
      return status
  }
}
