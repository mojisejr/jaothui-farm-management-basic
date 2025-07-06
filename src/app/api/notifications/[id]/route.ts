import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Update notification schema
const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
})

// GET /api/notifications/[id] - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get notification with ownership verification
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      notification: {
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
      },
    })
  } catch (error) {
    console.error('Notification fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/[id] - Update notification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    const validatedData = updateNotificationSchema.parse(body)

    // Verify notification exists and user owns it
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        ...(validatedData.isRead !== undefined && { isRead: validatedData.isRead }),
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        type: updatedNotification.type,
        title: updatedNotification.title,
        message: updatedNotification.message,
        data: updatedNotification.data,
        isRead: updatedNotification.isRead,
        priority: updatedNotification.priority,
        createdAt: updatedNotification.createdAt,
        scheduledAt: updatedNotification.scheduledAt,
        farmId: updatedNotification.farmId,
        farm: updatedNotification.farm,
        relatedEntityType: updatedNotification.relatedEntityType,
        relatedEntityId: updatedNotification.relatedEntityId,
      },
    })
  } catch (error) {
    console.error('Notification update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Verify notification exists and user owns it
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Notification deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}