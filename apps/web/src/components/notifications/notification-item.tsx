'use client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const isUnread = !notification.read_at

  function handleClick() {
    if (isUnread) {
      fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' })
    }
    onClose()
  }

  function getIcon(type: string) {
    switch (type) {
      case 'TIMER_STARTED':
        return '🟢'
      case 'TIMER_COMPLETED':
        return '✅'
      case 'FRIENDSHIP_CONFIRMED':
        return '🤝'
      case 'PAYMENT_VALIDATED':
        return '💰'
      case 'PAYMENT_REJECTED':
        return '❌'
      case 'RECEIPT_UPLOADED':
        return '📎'
      case 'NEW_ORDER':
        return '🛒'
      default:
        return '🔔'
    }
  }

  function getRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-MX')
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full border-b border-gray-800 px-4 py-3 text-left transition hover:bg-gray-800/50 ${
        isUnread ? 'bg-gray-800/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{getIcon(notification.type)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${isUnread ? 'font-semibold text-white' : 'text-gray-300'}`}>
              {notification.title}
            </p>
            <span className="ml-2 shrink-0 text-xs text-gray-500">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{notification.message}</p>
        </div>
        {isUnread && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
        )}
      </div>
    </button>
  )
}
