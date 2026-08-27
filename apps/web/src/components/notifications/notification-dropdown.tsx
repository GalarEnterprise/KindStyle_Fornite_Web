'use client'

import { NotificationItem } from './notification-item'
import { NotificationEmpty } from './notification-empty'
import { useNotifications } from '@/hooks/use-notifications'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  function handleMarkAllRead() {
    markAllRead()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">
            Notificaciones {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <NotificationEmpty />
          ) : (
            notifications.map((notification: { id: string; type: string; title: string; message: string; read_at: string | null; created_at: string }) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
