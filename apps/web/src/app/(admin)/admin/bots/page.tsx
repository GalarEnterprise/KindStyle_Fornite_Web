'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Bot {
  id: string
  name: string
  epic_account_id: string
  status: string
  friendship_bots: Array<{
    id: string
    friendship_status: string
    request_status: string
    eligibility_at: string | null
    friendship_request: {
      id: string
      user: { id: string; email: string; nickname: string | null }
    }
  }>
}

export default function AdminBotsPage() {
  const { data, isLoading, mutate } = useSWR('/api/admin/bots', fetcher, { refreshInterval: 30000 })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Bot | null>(null)
  const [form, setForm] = useState({ name: '', epic_account_id: '', status: 'ACTIVE' })

  const bots: Bot[] = data?.data ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editing ? `/api/admin/bots/${editing.id}` : '/api/admin/bots'
    const method = editing ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', epic_account_id: '', status: 'ACTIVE' })
    mutate()
  }

  function handleEdit(bot: Bot) {
    setEditing(bot)
    setForm({ name: bot.name, epic_account_id: bot.epic_account_id, status: bot.status })
    setShowForm(true)
  }

  return (
    <div className="p-8">
      <AdminPageHeader
        title="Cuentas Bot"
        description="Gestión de cuentas de cumplimiento"
        actions={
          <button
            onClick={() => { setEditing(null); setForm({ name: '', epic_account_id: '', status: 'ACTIVE' }); setShowForm(true) }}
            className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500"
          >
            + Agregar Bot
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-purple-800 bg-purple-900 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">{editing ? 'Editar Bot' : 'Nuevo Bot'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-purple-300">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded border border-purple-700 bg-purple-900 px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-purple-300">Epic Account ID</label>
              <input
                value={form.epic_account_id}
                onChange={(e) => setForm({ ...form, epic_account_id: e.target.value })}
                className="mt-1 w-full rounded border border-purple-700 bg-purple-900 px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-purple-300">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded border border-purple-700 bg-purple-900 px-3 py-2 text-sm text-white"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500">
              {editing ? 'Guardar' : 'Crear'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="rounded border border-purple-700 px-4 py-2 text-sm text-purple-200 hover:bg-purple-800">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse text-purple-300">Cargando bots...</div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-lg border border-purple-800 bg-purple-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{bot.name}</p>
                  <p className="text-xs text-purple-300">{bot.epic_account_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-1 text-xs ${bot.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-purple-800 text-purple-300'}`}>
                    {bot.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-xs text-purple-300">
                    {bot.friendship_bots.length} asignaciones
                  </span>
                  <button onClick={() => handleEdit(bot)} className="text-purple-400 hover:text-purple-300 text-sm">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {bots.length === 0 && (
            <p className="text-center text-purple-300">No hay bots configurados</p>
          )}
        </div>
      )}
    </div>
  )
}
