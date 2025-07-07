import { NextRequest, NextResponse } from 'next/server'
import { getTemplateById } from '@/constants/activity-templates'

// GET /api/activity-templates/[id] - Get specific activity template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = getTemplateById(id)

    if (!template) {
      return NextResponse.json(
        { error: 'Activity template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Activity template fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity template' },
      { status: 500 }
    )
  }
}