'use client'

import useSWR from 'swr'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardMetrics {
  orders: { today: number; week: number; month: number }
  revenue: { today: number; week: number; month: number }
  pendingValidations: number
  activeFriendships: number
  activeBots: number
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/api/admin/dashboard', fetcher, { refreshInterval: 30000 })

  if (isLoading) {
    return (
      <div className="p-8">
        <AdminPageHeader title="Dashboard" description="Métricas generales" />
        <div className="animate-pulse text-purple-300">Cargando métricas...</div>
      </div>
    )
  }

  const metrics: DashboardMetrics | undefined = data?.data

  return (
    <div className="p-8">
      <AdminPageHeader title="Dashboard" description="Métricas generales" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Pedidos Hoy" value={metrics?.orders.today ?? 0} />
        <MetricCard title="Pedidos Semana" value={metrics?.orders.week ?? 0} />
        <MetricCard title="Pedidos Mes" value={metrics?.orders.month ?? 0} />
        <MetricCard title="Ingresos Hoy" value={`$${metrics?.revenue.today ?? 0}`} />
        <MetricCard title="Ingresos Semana" value={`$${metrics?.revenue.week ?? 0}`} />
        <MetricCard title="Ingresos Mes" value={`$${metrics?.revenue.month ?? 0}`} />
        <MetricCard title="Validaciones Pendientes" value={metrics?.pendingValidations ?? 0} highlight />
        <MetricCard title="Amistades Activas" value={metrics?.activeFriendships ?? 0} />
        <MetricCard title="Bots Activos" value={metrics?.activeBots ?? 0} />
      </div>
    </div>
  )
}

function MetricCard({ title, value, highlight }: { title: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-yellow-700 bg-yellow-900/20' : 'border-purple-800 bg-purple-900'}`}>
      <p className="text-sm text-purple-300">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
