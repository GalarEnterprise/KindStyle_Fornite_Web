import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { getSettings, updateSettings } from '@/lib/services/settings/settings-service'

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  try {
    const settings = await getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('GET /api/admin/settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const result = await updateSettings(body as Record<string, unknown>)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const settings = await getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
