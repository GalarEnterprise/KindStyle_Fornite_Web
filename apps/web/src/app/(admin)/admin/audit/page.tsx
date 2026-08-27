'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AuditEvent {
  id: string
  entity: string
  entity_id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  user: { id: string; email: string; nickname: string | null } | null
}

export default function AdminAuditPage() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (entity) params.set('entity', entity)
  if (action) params.set('action', action)

  const { data, isLoading } = useSWR(`/api/admin/audit?${params}`, fetcher, { refreshInterval: 30000 })

  const events: AuditEvent[] = data?.data?.events ?? []
  const total: number = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-8">
      <AdminPageHeader title="Auditoría" description="Registro de eventos del sistema" />

      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-400">Entidad</label>
          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1) }}
            className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white"
          >
            <option value="">Todas</option>
            <option value="USER">Usuarios</option>
            <option value="REQUEST">Solicitudes</option>
            <option value="PAYMENT">Pagos</option>
            <option value="FRIENDSHIP">Amistades</option>
            <option value="BOT">Bots</option>
            <option value="TIMER">Timers</option>
            <option value="NOTIFICATION">Notificaciones</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400">Acción</label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
            className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white"
          >
            <option value="">Todas</option>
            <option value="CREATED">Creación</option>
            <option value="UPDATED">Actualización</option>
            <option value="DELETED">Eliminación</option>
            <option value="STATUS_CHANGED">Cambio de estado</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-400">Cargando auditoría...</div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded border border-gray-800 bg-gray-900 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{event.entity}</span>
                  <span className="text-sm text-white">{event.action}</span>
                  <span className="text-xs text-gray-500">{event.entity_id}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {event.user?.nickname ?? event.user?.email ?? 'Sistema'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <pre className="mt-2 overflow-x-auto text-xs text-gray-500">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-center text-gray-400">No hay eventos de auditoría</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">{total} eventos — Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
