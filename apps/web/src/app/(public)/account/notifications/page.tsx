'use client'

import { useState, useEffect } from 'react'

interface Preferences {
  email_enabled: boolean
  web_enabled: boolean
  whatsapp_enabled: boolean
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrefs(data.data)
        else setError(data.error?.message ?? 'Error al cargar preferencias')
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setIsLoading(false))
  }, [])

  function handleToggle(key: keyof Preferences) {
    if (!prefs) return

    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setIsSaving(true)

    fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrefs(data.data)
        else setError(data.error?.message ?? 'Error al guardar')
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setIsSaving(false))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-lg">
          <div className="animate-pulse text-gray-400">Cargando preferencias...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-white">Preferencias de Notificación</h1>
        <p className="mt-2 text-sm text-gray-400">
          Configura cómo quieres recibir tus notificaciones.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {prefs && (
          <div className="mt-6 space-y-4">
            <ToggleRow
              label="Notificaciones web"
              description="Campanita en el header"
              enabled={prefs.web_enabled}
              onToggle={() => handleToggle('web_enabled')}
              disabled={isSaving}
            />
            <ToggleRow
              label="Correo electrónico"
              description="Recibe notificaciones por email"
              enabled={prefs.email_enabled}
              onToggle={() => handleToggle('email_enabled')}
              disabled={isSaving}
            />
            <ToggleRow
              label="WhatsApp"
              description="Recibe enlaces de WhatsApp"
              enabled={prefs.whatsapp_enabled}
              onToggle={() => handleToggle('whatsapp_enabled')}
              disabled={isSaving}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? 'bg-purple-600' : 'bg-gray-700'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
