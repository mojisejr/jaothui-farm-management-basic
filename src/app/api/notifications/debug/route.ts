import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationTriggers } from '@/lib/notifications/triggers'
import { NotificationService } from '@/lib/notifications/service'
import prisma from '@/lib/prisma'

// Debug endpoint for testing notifications
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = await getAccessTokenFromCookies()
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action } = await request.json()

    switch (action) {
      case 'test_notification':
        // Create a test notification
        const testNotification = await NotificationService.createNotification({
          userId: payload.userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: '🧪 Test Notification',
          message: 'This is a test notification created at ' + new Date().toLocaleString('th-TH'),
          priority: 'NORMAL'
        })
        
        return NextResponse.json({
          success: true,
          message: 'Test notification created',
          notification: testNotification
        })

      case 'check_triggers':
        // Run notification triggers manually
        const results = await NotificationTriggers.runAllChecks()
        
        return NextResponse.json({
          success: true,
          message: 'Triggers checked',
          results
        })

      case 'database_stats':
        // Get database statistics
        const stats = await prisma.notification.groupBy({
          by: ['type', 'isRead'],
          _count: true,
          where: {
            userId: payload.userId
          }
        })

        const totalNotifications = await prisma.notification.count({
          where: { userId: payload.userId }
        })

        const unreadCount = await prisma.notification.count({
          where: { 
            userId: payload.userId,
            isRead: false
          }
        })

        return NextResponse.json({
          success: true,
          stats: {
            total: totalNotifications,
            unread: unreadCount,
            byType: stats
          }
        })

      case 'recent_activities':
        // Check recent activities that might need notifications
        const recentActivities = await prisma.activity.findMany({
          where: {
            animal: {
              farm: {
                OR: [
                  { ownerId: payload.userId },
                  { members: { some: { profileId: payload.userId } } }
                ]
              }
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          include: {
            animal: {
              include: {
                farm: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        const upcomingSchedules = await prisma.activitySchedule.findMany({
          where: {
            animal: {
              farm: {
                OR: [
                  { ownerId: payload.userId },
                  { members: { some: { profileId: payload.userId } } }
                ]
              }
            },
            scheduledDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 48 * 60 * 60 * 1000) // Next 48 hours
            },
            status: 'PENDING'
          },
          include: {
            animal: {
              include: {
                farm: true
              }
            }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10
        })

        return NextResponse.json({
          success: true,
          data: {
            recentActivities: recentActivities.length,
            upcomingSchedules: upcomingSchedules.length,
            activities: recentActivities,
            schedules: upcomingSchedules
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for quick checks
export async function GET(_request: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies()
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Quick health check
    const notificationCount = await prisma.notification.count({
      where: { userId: payload.userId }
    })

    const unreadCount = await prisma.notification.count({
      where: { 
        userId: payload.userId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      userId: payload.userId,
      notifications: {
        total: notificationCount,
        unread: unreadCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug GET error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}