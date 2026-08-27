'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useNotifications() {
  const { data: unreadData, mutate: mutateUnread } = useSWR(
    '/api/notifications/unread-count',
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: notificationsData, mutate: mutateNotifications } = useSWR(
    '/api/notifications',
    fetcher,
    { refreshInterval: 30000 }
  )

  const unreadCount = unreadData?.data?.count ?? 0
  const notifications = notificationsData?.data?.notifications ?? []

  function markAllRead() {
    fetch('/api/notifications/read-all', { method: 'POST' }).then(() => {
      mutateUnread()
      mutateNotifications()
    })
  }

  return { unreadCount, notifications, markAllRead, mutateUnread, mutateNotifications }
}
