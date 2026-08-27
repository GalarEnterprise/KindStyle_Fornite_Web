import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { updateBot } from '@/lib/services/bot/bot-service'

async function handleUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'JSON inválido' } },
      { status: 400 }
    )
  }

  try {
    const result = await updateBot(id, body)
    if (!result.success) {
      const status =
        result.error.code === 'BOT_NOT_FOUND' ? 404 : result.error.code === 'INVALID_STATUS_TRANSITION' ? 409 : 400
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('PATCH /api/admin/bots/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}

export const PATCH = handleUpdate
export const PUT = handleUpdate
