import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { listAdminQueue } from '@/lib/services/friendship/friendship-service'

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const requests = await listAdminQueue()
  return NextResponse.json({ success: true, data: requests })
}
