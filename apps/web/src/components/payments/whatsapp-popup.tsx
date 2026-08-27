'use client'

import { useState } from 'react'

interface WhatsAppPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (phone: string) => void
  isSaving?: boolean
}

export function WhatsAppPopup({ isOpen, onClose, onSave, isSaving }: WhatsAppPopupProps) {
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  function handleSave() {
    if (phone.trim()) {
      onSave(phone.trim())
    }
  }

  function handleSkip() {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">¿Quieres proporcionarnos tu número?</h3>
        <p className="mt-2 text-sm text-gray-400">
          Para avisarte cuando tu pedido esté listo, puedes dejarnos tu número de WhatsApp.
        </p>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Número de WhatsApp"
          className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Omitir
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !phone.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
