import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getEligibilityStatus } from '@/lib/services/timer/timer-service'

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid friendship request ID'),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const parsed = ParamsSchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    )
  }

  try {
    const timers = await getEligibilityStatus(parsed.data.id)

    return NextResponse.json({
      success: true,
      data: timers,
    })
  } catch (error) {
    console.error('[API] Error fetching timer status:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error fetching timer status' } },
      { status: 500 }
    )
  }
}
