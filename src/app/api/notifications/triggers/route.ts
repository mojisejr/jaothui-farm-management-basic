import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggers } from '@/lib/notifications/triggers'

// POST /api/notifications/triggers - Run notification triggers manually
export async function POST(request: NextRequest) {
  try {
    // Check authorization header for cron jobs or admin access
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run all notification checks
    const results = await NotificationTriggers.runAllChecks()
    
    // Count successful and failed operations
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    const summary = {
      success: true,
      message: `Notification triggers completed`,
      results: {
        successful,
        failed,
        total: results.length
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Failed to run notification triggers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run notification triggers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/notifications/triggers - Get trigger status
export async function GET(_request: NextRequest) {
  try {
    const now = new Date()
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Notification triggers are ready',
      timestamp: now.toISOString(),
      nextRun: 'Triggered by cron job or manual request'
    })
  } catch (error) {
    console.error('Failed to get trigger status:', error)
    return NextResponse.json(
      { error: 'Failed to get trigger status' },
      { status: 500 }
    )
  }
}