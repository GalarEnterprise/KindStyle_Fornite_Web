export default function NotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
      <p className="mt-1 text-sm text-gray-400">
        Alertas y avisos importantes.
      </p>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
          <span className="text-3xl">🔔</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Próximamente</h2>
        <p className="mt-2 text-sm text-gray-400">
          El sistema de notificaciones estará disponible pronto.
        </p>
      </div>
    </div>
  )
}
