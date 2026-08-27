'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminDataTable } from '@/components/admin/admin-data-table'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'CREATED', label: 'Nuevo' },
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'PAYMENT_PENDING', label: 'Pago pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'FULFILLMENT_PENDING', label: 'Enviando' },
  { value: 'FULFILLED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

interface Request {
  id: string
  request_number: string
  status: string
  total_vbucks: number
  total_mxn: string
  created_at: string
  user: { id: string; email: string; nickname: string | null }
  items: Array<{ id: string; product_name_snapshot: string; price_vbucks_snapshot: number; quantity: number }>
}

export default function AdminRequestsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Request | null>(null)

  const url = `/api/admin/requests?page=${page}&limit=20${status ? `&status=${status}` : ''}`
  const { data, isLoading } = useSWR(url, fetcher, { refreshInterval: 30000 })

  const requests: Request[] = data?.data?.requests ?? []
  const total: number = data?.data?.total ?? 0

  function handleCopy(id: string) {
    navigator.clipboard.writeText(id)
  }

  return (
    <div className="p-8">
      <AdminPageHeader title="Solicitudes" description="Gestión de pedidos" />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); setSelected(null) }}
            className={`rounded-md px-3 py-1.5 text-sm ${
              status === tab.value
                ? 'bg-purple-600 text-white'
                : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-400">Cargando solicitudes...</div>
      ) : selected ? (
        <RequestDetail request={selected} onBack={() => setSelected(null)} onCopy={handleCopy} />
      ) : (
        <AdminDataTable
          columns={[
            { key: 'request_number', label: 'Pedido', sortable: true },
            { key: 'user', label: 'Cliente', render: (r) => r.user.nickname ?? r.user.email },
            { key: 'items', label: 'Productos', render: (r) => `${r.items.length} items` },
            { key: 'total_mxn', label: 'Total' },
            { key: 'status', label: 'Estado' },
            { key: 'created_at', label: 'Fecha', render: (r) => new Date(r.created_at).toLocaleDateString('es-MX') },
          ]}
          data={requests}
          total={total}
          page={page}
          limit={20}
          onPageChange={setPage}
          keyExtractor={(r) => r.id}
          actions={(r) => (
            <button onClick={() => setSelected(r)} className="text-purple-400 hover:text-purple-300 text-sm">
              Ver
            </button>
          )}
        />
      )}
    </div>
  )
}

function RequestDetail({ request, onBack, onCopy }: { request: Request; onBack: () => void; onCopy: (id: string) => void }) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-purple-400 hover:text-purple-300">
        ← Volver a la lista
      </button>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">{request.request_number}</h2>
          <button onClick={() => onCopy(request.request_number)} className="text-gray-400 hover:text-white text-xs">
            [COPIAR]
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400">Cliente</p>
            <p className="text-sm text-white">{request.user.nickname ?? request.user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Estado</p>
            <p className="text-sm text-white">{request.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm text-white">${request.total_mxn} MXN</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">V-Bucks</p>
            <p className="text-sm text-white">{request.total_vbucks}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">Productos</p>
          {request.items.map((item) => (
            <div key={item.id} className="flex justify-between border-t border-gray-800 py-2 text-sm">
              <span className="text-gray-300">{item.product_name_snapshot}</span>
              <span className="text-gray-400">{item.price_vbucks_snapshot} VB x {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
