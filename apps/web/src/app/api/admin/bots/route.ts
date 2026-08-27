import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { listBots, createBot } from '@/lib/services/bot/bot-service'

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const bots = await listBots()
  return NextResponse.json({ success: true, data: bots })
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

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
    const result = await createBot(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/bots error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
