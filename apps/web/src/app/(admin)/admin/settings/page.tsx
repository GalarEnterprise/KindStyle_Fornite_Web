'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminSettingsPage() {
  const { data, isLoading, mutate } = useSWR('/api/admin/settings', fetcher)
  const [form, setForm] = useState({
    vbucks_price_mxn: '',
    friendship_period_hours: '',
    max_concurrent_sessions: '',
    maintenance_mode: false,
    whatsapp_number: '',
    email_from: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data?.data) {
      setForm({
        vbucks_price_mxn: data.data.vbucks_price_mxn ?? '',
        friendship_period_hours: data.data.friendship_period_hours ?? '',
        max_concurrent_sessions: data.data.max_concurrent_sessions ?? '',
        maintenance_mode: data.data.maintenance_mode === 'true',
        whatsapp_number: data.data.whatsapp_number ?? '',
        email_from: data.data.email_from ?? '',
      })
    }
  }, [data])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vbucks_price_mxn: Number(form.vbucks_price_mxn),
          friendship_period_hours: Number(form.friendship_period_hours),
          max_concurrent_sessions: Number(form.max_concurrent_sessions),
          maintenance_mode: form.maintenance_mode,
          whatsapp_number: form.whatsapp_number,
          email_from: form.email_from,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setMessage('Guardado correctamente')
        mutate()
      } else {
        setMessage(`Error: ${result.error?.message}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <AdminPageHeader title="Configuración" description="Ajustes del sistema" />
        <div className="animate-pulse text-gray-400">Cargando configuración...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <AdminPageHeader title="Configuración" description="Ajustes del sistema" />

      <div className="max-w-2xl space-y-6">
        <Section title="Precios">
          <Field label="Precio V-Bucks (MXN)">
            <input
              type="number"
              step="0.01"
              value={form.vbucks_price_mxn}
              onChange={(e) => setForm({ ...form, vbucks_price_mxn: e.target.value })}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </Field>
        </Section>

        <Section title="Amistades">
          <Field label="Período de amistad (horas)">
            <input
              type="number"
              value={form.friendship_period_hours}
              onChange={(e) => setForm({ ...form, friendship_period_hours: e.target.value })}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </Field>
        </Section>

        <Section title="Sesiones">
          <Field label="Máximo de sesiones concurrentes">
            <input
              type="number"
              value={form.max_concurrent_sessions}
              onChange={(e) => setForm({ ...form, max_concurrent_sessions: e.target.value })}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </Field>
        </Section>

        <Section title="Contacto">
          <Field label="Número de WhatsApp">
            <input
              type="text"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </Field>
          <Field label="Email From (Resend)">
            <input
              type="email"
              value={form.email_from}
              onChange={(e) => setForm({ ...form, email_from: e.target.value })}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </Field>
        </Section>

        <Section title="Sistema">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800"
            />
            <span className="text-sm text-gray-300">Modo mantenimiento</span>
          </label>
        </Section>

        {message && (
          <p className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-purple-600 px-6 py-2 text-sm text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-300">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
