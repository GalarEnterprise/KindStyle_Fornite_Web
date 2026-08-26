import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/services/catalog/collection-service'

export async function GET() {
  try {
    const collections = await getCollections()

    return NextResponse.json({
      success: true,
      data: collections,
    })
  } catch (error) {
    console.error('[API /api/collections] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch collections',
        },
      },
      { status: 500 }
    )
  }
}
