import { NextResponse } from 'next/server'
import { clearAdminCookies } from '@/lib/auth/cookies'

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Sesión cerrada correctamente' },
    { status: 200 }
  )
  clearAdminCookies(response)
  return response
}
