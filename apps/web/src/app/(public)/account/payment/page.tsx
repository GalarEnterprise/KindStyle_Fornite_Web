'use client'

import { useState, useEffect } from 'react'

interface PaymentItem {
  id: string
  product_name_snapshot: string
  price_vbucks_snapshot: number
  quantity: number
}

interface PaymentRequest {
  id: string
  request_number: string
  items: PaymentItem[]
}

interface Payment {
  id: string
  method: string
  amount: string
  status: string
  receipt_file_url: string | null
  created_at: string
  request: PaymentRequest
}

export default function PaymentPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payment')
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
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse text-gray-400">Cargando pagos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-white">Mis Pagos</h1>
          <div className="mt-8 text-center text-gray-400">
            No hay pedidos pendientes
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Mis Pagos</h1>

        <div className="mt-8 space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {payment.request.request_number}
                </span>
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

              {payment.status === 'PENDING_RECEIPT' && (
                <div className="mt-4">
                  <PaymentMethodSelector paymentId={payment.id} onComplete={fetchPayments} />
                </div>
              )}

              {payment.status !== 'PENDING_RECEIPT' && (
                <div className="mt-4">
                  <PaymentTracker status={payment.status} />
                </div>
              )}
            </div>
          ))}
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

function PaymentMethodSelector({ paymentId, onComplete }: { paymentId: string; onComplete: () => void }) {
  const [method, setMethod] = useState<'TRANSFER' | 'OXXO'>('TRANSFER')
  const [showUploader, setShowUploader] = useState(false)

  const bankDetails = {
    TRANSFER: {
      label: 'Transferencia Bancaria',
      details: 'CLABE: 722969040853088360\nBeneficiario: Lidia Isela Perez R.',
    },
    OXXO: {
      label: 'Depósito OXXO',
      details: 'Cuenta: 4217 4703 3148 7708\nBeneficiario: Lidia Isela Perez R.',
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMethod('TRANSFER')}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            method === 'TRANSFER'
              ? 'border-purple-500 bg-purple-500/10 text-purple-300'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          Transferencia
        </button>
        <button
          onClick={() => setMethod('OXXO')}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            method === 'OXXO'
              ? 'border-purple-500 bg-purple-500/10 text-purple-300'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          OXXO
        </button>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
        <div className="text-sm font-medium text-white">{bankDetails[method].label}</div>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-400">
          {bankDetails[method].details}
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(bankDetails[method].details)
            alert('Datos copiados')
          }}
          className="mt-3 rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700"
        >
          COPIAR DATOS
        </button>
      </div>

      {!showUploader ? (
        <button
          onClick={() => setShowUploader(true)}
          className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          VALIDAR PAGO
        </button>
      ) : (
        <ReceiptUploader paymentId={paymentId} onComplete={onComplete} />
      )}
    </div>
  )
}

function ReceiptUploader({ paymentId, onComplete }: { paymentId: string; onComplete: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const res = await fetch(`/api/payment/${paymentId}/receipt`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Error al subir comprobante')
        return
      }

      onComplete()
    } catch {
      setError('Error de conexión')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-gray-700 p-4 text-center">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={isUploading}
          className="hidden"
          id="receipt-upload"
        />
        <label
          htmlFor="receipt-upload"
          className="cursor-pointer text-sm text-gray-400 hover:text-gray-300"
        >
          {isUploading ? 'Subiendo...' : 'Seleccionar comprobante (JPG, PNG, WEBP, max 5MB)'}
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

function PaymentTracker({ status }: { status: string }) {
  const steps = [
    { key: 'PENDING_RECEIPT', label: 'Comprobante subido' },
    { key: 'VALIDATION_IN_PROGRESS', label: 'En revisión' },
    { key: 'VALIDATED', label: 'Validado' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === status)
  const isRejected = status === 'REJECTED'

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isRejected
                ? 'bg-red-500'
                : i <= currentIndex
                ? 'bg-green-500'
                : 'bg-gray-600'
            }`}
          />
          <span className="text-xs text-gray-400">{step.label}</span>
          {i < steps.length - 1 && <div className="h-px w-4 bg-gray-700" />}
        </div>
      ))}
      {isRejected && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-400">Rechazado</span>
        </div>
      )}
    </div>
  )
}
