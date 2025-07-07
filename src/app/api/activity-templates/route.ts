import { NextRequest, NextResponse } from 'next/server'
import { 
  ACTIVITY_TEMPLATES, 
  ACTIVITY_CATEGORIES,
  getTemplatesByCategory,
  getTemplateStatistics
} from '@/constants/activity-templates'

// GET /api/activity-templates - Get activity templates with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const categoryId = searchParams.get('categoryId')
    const schedulableOnly = searchParams.get('schedulableOnly') === 'true'
    const maxDuration = searchParams.get('maxDuration')
    const search = searchParams.get('search')
    const includeStats = searchParams.get('includeStats') === 'true'

    let templates = ACTIVITY_TEMPLATES

    // Apply filters
    if (categoryId) {
      templates = getTemplatesByCategory(categoryId)
    }

    if (schedulableOnly) {
      templates = templates.filter(t => t.isSchedulable)
    }

    if (maxDuration) {
      const duration = parseInt(maxDuration)
      if (!isNaN(duration)) {
        templates = templates.filter(t => 
          t.defaultDuration && t.defaultDuration <= duration
        )
      }
    }

    if (search) {
      const lowerQuery = search.toLowerCase()
      templates = templates.filter(template => 
        template.title.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.category.name.toLowerCase().includes(lowerQuery)
      )
    }

    // Prepare response
    const response = {
      success: true,
      templates,
      categories: ACTIVITY_CATEGORIES,
      count: templates.length,
      statistics: undefined as ReturnType<typeof getTemplateStatistics> | undefined
    }

    // Include statistics if requested
    if (includeStats) {
      response.statistics = getTemplateStatistics()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Activity templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity templates' },
      { status: 500 }
    )
  }
}