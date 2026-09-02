'use client'

import { useState } from 'react'
import { PAYMENT_DETAILS, formatClabe, formatOxxoAccount } from '@/lib/config/payment-info'
import { copyToClipboard } from '@/lib/utils/copy'

interface PaymentInfoProps {
  method: 'TRANSFER' | 'OXXO'
  amountMxn: number
}

export function PaymentInfo({ method, amountMxn }: PaymentInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const isTransfer = method === 'TRANSFER'
  const details = isTransfer
    ? PAYMENT_DETAILS.transfer
    : PAYMENT_DETAILS.oxxo

  async function handleCopy(text: string, field: string) {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{method === 'TRANSFER' ? '🏦' : '🏪'}</span>
        <div>
          <h3 className="font-semibold text-white">
            {method === 'TRANSFER' ? 'Transferencia bancaria' : 'OXXO'}
          </h3>
          <p className="text-sm text-gray-400">
            {method === 'TRANSFER'
              ? 'Depósito directo o transferencia desde tu app bancaria'
              : 'Paga en efectivo en cualquier tienda OXXO'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isTransfer ? (
          <>
            <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
              <div>
                <p className="text-xs text-gray-400">CLABE</p>
                <p className="font-mono text-lg font-bold text-white tracking-wider">
                  {formatClabe(PAYMENT_DETAILS.transfer.clabe)}
                </p>
              </div>
              <button
                onClick={() => handleCopy(PAYMENT_DETAILS.transfer.clabe, 'clabe')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  copiedField === 'clabe'
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedField === 'clabe' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
              <div>
                <p className="text-xs text-gray-400">Beneficiario</p>
                <p className="text-sm font-medium text-white">{details.beneficiary}</p>
              </div>
              <button
                onClick={() => handleCopy(details.beneficiary, 'beneficiary')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  copiedField === 'beneficiary'
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedField === 'beneficiary' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="rounded-lg bg-gray-800 p-3">
              <p className="text-xs text-gray-400">Banco</p>
              <p className="text-sm font-medium text-white">Mercado Pago</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
              <div>
                <p className="text-xs text-gray-400">Número de cuenta</p>
                <p className="font-mono text-lg font-bold text-white tracking-wider">
                  {formatOxxoAccount(PAYMENT_DETAILS.oxxo.account)}
                </p>
              </div>
              <button
                onClick={() => handleCopy(PAYMENT_DETAILS.oxxo.account, 'account')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  copiedField === 'account'
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedField === 'account' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="rounded-lg bg-gray-800 p-3">
              <p className="text-xs text-gray-400">A nombre de</p>
              <p className="text-sm font-medium text-white">{details.beneficiary}</p>
            </div>
          </>
        )}

        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div>
            <p className="text-xs text-yellow-400">Monto a pagar</p>
            <p className="text-xl font-bold text-yellow-400">${amountMxn.toFixed(2)} MXN</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-medium text-gray-300">Instrucciones:</h4>
        <ol className="space-y-2">
          {details.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
