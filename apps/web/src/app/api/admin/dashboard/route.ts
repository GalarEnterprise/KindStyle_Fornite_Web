import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { db } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingValidations,
      activeFriendships,
      activeBots,
    ] = await Promise.all([
      db.request.count({ where: { created_at: { gte: startOfDay } } }),
      db.request.count({ where: { created_at: { gte: startOfWeek } } }),
      db.request.count({ where: { created_at: { gte: startOfMonth } } }),
      db.payment.aggregate({
        where: { status: 'VALIDATED', validated_at: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: 'VALIDATED', validated_at: { gte: startOfWeek } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: 'VALIDATED', validated_at: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.payment.count({ where: { status: 'VALIDATION_IN_PROGRESS' } }),
      db.friendshipRequest.count({ where: { status: { in: ['CREATED', 'PROCESSING', 'WAITING_ACCEPTANCE', 'PARTIALLY_READY'] } } }),
      db.fulfillmentAccount.count({ where: { status: 'ACTIVE' } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders: { today: ordersToday, week: ordersWeek, month: ordersMonth },
        revenue: {
          today: Number(revenueToday._sum.amount ?? 0),
          week: Number(revenueWeek._sum.amount ?? 0),
          month: Number(revenueMonth._sum.amount ?? 0),
        },
        pendingValidations,
        activeFriendships,
        activeBots,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
