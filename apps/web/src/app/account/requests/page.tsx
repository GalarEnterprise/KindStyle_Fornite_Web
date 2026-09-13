import type { Metadata } from 'next'
import { RequestList } from '@/components/requests/request-list'

export const metadata: Metadata = {
  title: 'Mis solicitudes — KindStyle',
}

export default function AccountRequestsPage() {
  return (
    <div className="min-h-screen bg-purple-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Mis solicitudes</h1>
        <p className="mt-1 text-sm text-purple-300">
          Historial de tus solicitudes de compra y su estado actual.
        </p>

        <div className="mt-6">
          <RequestList />
        </div>
      </div>
    </div>
  )
}
