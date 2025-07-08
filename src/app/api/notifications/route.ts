import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Get notifications for authenticated user
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Build where condition
    const whereCondition: Record<string, unknown> = {
      userId: payload.userId,
    }

    if (unreadOnly) {
      whereCondition.isRead = false
    }

    // Get total count
    const totalCount = await prisma.notification.count({
      where: whereCondition,
    })

    const totalPages = Math.ceil(totalCount / limit)
    const offset = (page - 1) * limit

    console.log('🔔 [API] Fetching notifications for user:', payload.userId, {
      page,
      limit,
      unreadOnly,
      totalCount
    })

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereCondition,
      orderBy: [
        { priority: 'desc' }, // Urgent first
        { createdAt: 'desc' }, // Newest first
      ],
      skip: offset,
      take: limit,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: payload.userId,
        isRead: false,
      },
    })

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    }

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        priority: notification.priority,
        createdAt: notification.createdAt,
        scheduledAt: notification.scheduledAt,
        farmId: notification.farmId,
        farm: notification.farm,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
      })),
      unreadCount,
      pagination,
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// Create notification schema
const createNotificationSchema = z.object({
  type: z.enum([
    'ACTIVITY_REMINDER',
    'ACTIVITY_OVERDUE', 
    'SCHEDULE_REMINDER',
    'FARM_INVITATION',
    'MEMBER_JOINED',
    'ACTIVITY_COMPLETED',
    'ACTIVITY_CREATED',
    'SYSTEM_ANNOUNCEMENT'
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  scheduledAt: z.string().datetime().optional(),
  farmId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
  userIds: z.array(z.string().uuid()).optional(), // For bulk notifications
})

// Create notification (admin/system use)
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

    // Parse request body
    const body = await request.json()
    const validatedData = createNotificationSchema.parse(body)

    // Determine target users
    let targetUserIds: string[] = []
    
    if (validatedData.userIds) {
      targetUserIds = validatedData.userIds
    } else if (validatedData.farmId) {
      // Get all farm members
      const farmMembers = await prisma.farmMember.findMany({
        where: { farmId: validatedData.farmId },
        select: { profileId: true },
      })
      targetUserIds = farmMembers.map(member => member.profileId)
      
      // Also include farm owner
      const farm = await prisma.farm.findUnique({
        where: { id: validatedData.farmId },
        select: { ownerId: true },
      })
      if (farm?.ownerId && !targetUserIds.includes(farm.ownerId)) {
        targetUserIds.push(farm.ownerId)
      }
    } else {
      // Default to current user
      targetUserIds = [payload.userId]
    }

    // Create notifications for all target users
    const notifications = await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        userId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data || {},
        priority: validatedData.priority,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        farmId: validatedData.farmId,
        relatedEntityType: validatedData.relatedEntityType,
        relatedEntityId: validatedData.relatedEntityId,
      })),
    })

    return NextResponse.json({
      success: true,
      message: `Created ${notifications.count} notification(s)`,
      count: notifications.count,
    }, { status: 201 })

  } catch (error) {
    console.error('Notification creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}