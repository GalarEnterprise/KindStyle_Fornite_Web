'use client'

interface LastUpdateBadgeProps {
  lastUpdated: string
}

export function LastUpdateBadge({ lastUpdated }: LastUpdateBadgeProps) {
  const date = new Date(lastUpdated)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)

  const isStale = diffMinutes > 120

  let timeText: string
  if (diffMinutes < 1) {
    timeText = 'justo ahora'
  } else if (diffMinutes < 60) {
    timeText = `hace ${diffMinutes} min`
  } else if (diffHours < 24) {
    timeText = `hace ${diffHours}h ${diffMinutes % 60}m`
  } else {
    const days = Math.floor(diffHours / 24)
    timeText = `hace ${days} día${days > 1 ? 's' : ''}`
  }

  return (
    <div className="group relative inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          isStale
            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isStale ? 'bg-yellow-400' : 'bg-green-400'}`} />
        Última actualización: {timeText}
      </span>

      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-300 shadow-lg z-10">
        {isStale ? (
          <p>
            Los datos de la tienda pueden no ser los más recientes. La tienda se actualiza periódicamente desde la API de Fortnite.
          </p>
        ) : (
          <p>
            La tienda está actualizada. Los datos se sincronizan automáticamente cada hora.
          </p>
        )}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-gray-800 border-r border-b border-gray-700" />
      </div>
    </div>
  )
}
