'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/requests', label: 'Solicitudes', icon: '📋' },
  { href: '/admin/payments', label: 'Pagos', icon: '💳' },
  { href: '/admin/friendships', label: 'Amistades', icon: '👥' },
  { href: '/admin/bots', label: 'Bots', icon: '🤖' },
  { href: '/admin/users', label: 'Usuarios', icon: '👤' },
  { href: '/admin/settings', label: 'Configuración', icon: '⚙️' },
  { href: '/admin/audit', label: 'Auditoría', icon: '📝' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-gray-800 bg-gray-950">
      <div className="p-4">
        <Link href="/admin/dashboard" className="text-lg font-bold text-white">
          Admin Panel
        </Link>
      </div>
      <nav className="px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${
              pathname === item.href
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
