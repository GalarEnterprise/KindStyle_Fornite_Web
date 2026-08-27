import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import type { TokenPayload } from '@/lib/services/auth/token-service'

export async function requireAdminApi(
  request: NextRequest
): Promise<{ auth: TokenPayload } | { error: NextResponse }> {
  const payload = await getAuthUser(request)
  if (!payload) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
        { status: 401 }
      ),
    }
  }

  if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Sin permisos de administrador' } },
        { status: 403 }
      ),
    }
  }

  return { auth: payload }
}
