import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { RequestIdSchema } from '@/lib/validators/requests'
import { getRequestById, deleteRequest } from '@/lib/services/requests/request-service'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const parsed = RequestIdSchema.safeParse({ id })
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } },
        { status: 422 }
      )
    }

    const detail = await getRequestById(user.userId, parsed.data.id)
    if (!detail) {
      return NextResponse.json(
        { success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'La solicitud no existe' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: detail })
  } catch (error) {
    console.error('[API /api/requests/[id] GET] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const parsed = RequestIdSchema.safeParse({ id })
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } },
        { status: 422 }
      )
    }

    const result = await deleteRequest(user.userId, parsed.data.id)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'La solicitud no existe' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[API /api/requests/[id] DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
