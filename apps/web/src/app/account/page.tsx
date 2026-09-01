import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mi cuenta — KindStyle',
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Mi cuenta</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestiona tus solicitudes, pagos y configuración.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/account/requests"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Mis solicitudes</h2>
            <p className="mt-1 text-sm text-gray-400">
              Historial de tus compras y su estado.
            </p>
          </Link>

          <Link
            href="/account/bots"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Mis bots</h2>
            <p className="mt-1 text-sm text-gray-400">
              Bots configurados para amistad y envío.
            </p>
          </Link>

          <Link
            href="/account/payment"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Pagos</h2>
            <p className="mt-1 text-sm text-gray-400">
              Estados de pago y comprobantes.
            </p>
          </Link>

          <Link
            href="/account/notifications"
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-purple-500/50"
          >
            <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
            <p className="mt-1 text-sm text-gray-400">
              Alertas y avisos importantes.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
