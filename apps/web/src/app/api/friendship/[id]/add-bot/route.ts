import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { addExtraBot } from '@/lib/services/friendship/friendship-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    const result = await addExtraBot(auth.userId, id)
    if (!result.success) {
      const status = ['NOT_FOUND'].includes(result.error.code)
        ? 404
        : ['NO_BOTS_AVAILABLE', 'ALREADY_COMPLETE'].includes(result.error.code)
          ? 409
          : 400
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('POST /api/friendship/[id]/add-bot error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
