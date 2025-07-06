import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications/service'
import { NotificationTriggers } from '@/lib/notifications/triggers'
import prisma from '@/lib/prisma'

// POST /api/notifications/test - Test notification system
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = await getAccessTokenFromCookies()
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const { testType } = await request.json()
    
    const results = []

    switch (testType) {
      case 'system_announcement':
        // Create a test system announcement
        const announcement = await NotificationService.createSystemAnnouncement(
          'ทดสอบระบบแจ้งเตือน',
          'นี่คือการทดสอบระบบแจ้งเตือนของระบบ JAOTHUI Farm Management',
          undefined,
          'NORMAL'
        )
        results.push({
          type: 'system_announcement',
          success: true,
          data: announcement
        })
        break
        
      case 'activity_reminder':
        // Find user's pending activities
        const pendingActivities = await prisma.activity.findMany({
          where: {
            animal: {
              farm: {
                OR: [
                  { ownerId: payload.userId },
                  { members: { some: { profileId: payload.userId } } }
                ]
              }
            },
            status: 'PENDING',
            activityDate: {
              gte: new Date()
            }
          },
          take: 1
        })

        if (pendingActivities.length > 0) {
          const reminder = await NotificationService.createActivityReminder(
            pendingActivities[0].id,
            5 // 5 minutes reminder
          )
          results.push({
            type: 'activity_reminder',
            success: true,
            data: reminder
          })
        } else {
          results.push({
            type: 'activity_reminder',
            success: false,
            message: 'No pending activities found to test'
          })
        }
        break
        
      case 'triggers':
        // Test all notification triggers
        const triggerResults = await NotificationTriggers.runAllChecks()
        results.push({
          type: 'triggers',
          success: true,
          data: {
            successful: triggerResults.filter(r => r.status === 'fulfilled').length,
            failed: triggerResults.filter(r => r.status === 'rejected').length,
            total: triggerResults.length
          }
        })
        break
        
      case 'preferences':
        // Test user preferences
        const preferences = await NotificationTriggers.getUserNotificationPreferences(payload.userId)
        results.push({
          type: 'preferences',
          success: true,
          data: preferences
        })
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: system_announcement, activity_reminder, triggers, or preferences' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Notification test completed: ${testType}`,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Notification test error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run notification test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/notifications/test - Get test information
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      availableTests: [
        {
          type: 'system_announcement',
          description: 'Create a test system announcement notification'
        },
        {
          type: 'activity_reminder',
          description: 'Create a test activity reminder notification'
        },
        {
          type: 'triggers',
          description: 'Run all notification triggers'
        },
        {
          type: 'preferences',
          description: 'Check user notification preferences'
        }
      ],
      usage: 'POST with { "testType": "system_announcement" } in request body'
    })
  } catch (error) {
    console.error('Failed to get test information:', error)
    return NextResponse.json(
      { error: 'Failed to get test information' },
      { status: 500 }
    )
  }
}