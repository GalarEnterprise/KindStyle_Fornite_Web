import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { getAdminDetail } from '@/lib/services/friendship/friendship-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const { id } = await params
  const detail = await getAdminDetail(id)

  if (!detail) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Solicitud no encontrada' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: detail })
}
