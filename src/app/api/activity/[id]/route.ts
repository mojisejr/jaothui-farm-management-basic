import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications/service'

// Update activity schema
const updateActivitySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  activityDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  customFields: z.record(z.string()).optional()
})

// GET /api/activity/[id] - Get activity details
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

    // Get activity with access verification
    const activity = await prisma.activity.findFirst({
      where: {
        id,
        animal: {
          farm: {
            OR: [
              { ownerId: payload.userId },
              { members: { some: { profileId: payload.userId } } }
            ]
          }
        }
      },
      include: {
        animal: {
          include: {
            farm: {
              include: {
                owner: true
              }
            },
            animalType: true
          }
        }
      }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ activity })

  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

// PUT /api/activity/[id] - Update activity
export async function PUT(
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
    const validatedData = updateActivitySchema.parse(body)

    // Verify activity exists and user has access
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        animal: {
          farm: {
            OR: [
              { ownerId: payload.userId },
              { members: { some: { profileId: payload.userId } } }
            ]
          }
        }
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Check if status is changing to COMPLETED
    const wasCompleted = existingActivity.status === 'COMPLETED'
    const isBeingCompleted = validatedData.status === 'COMPLETED'

    // Update activity
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.activityDate && { activityDate: new Date(validatedData.activityDate) }),
        ...(validatedData.status && { status: validatedData.status }),
        updatedAt: new Date()
      },
      include: {
        animal: {
          include: {
            farm: {
              include: {
                owner: true
              }
            },
            animalType: true
          }
        }
      }
    })

    // Trigger completion notification if activity was just completed
    if (!wasCompleted && isBeingCompleted) {
      try {
        await NotificationService.createActivityCompletedNotification(updatedActivity.id, payload.userId)
      } catch (notificationError) {
        console.error('Failed to create activity completion notification:', notificationError)
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      activity: {
        id: updatedActivity.id,
        title: updatedActivity.title,
        description: updatedActivity.description,
        notes: updatedActivity.notes,
        activityDate: updatedActivity.activityDate,
        status: updatedActivity.status,
        animalId: updatedActivity.animalId,
        createdAt: updatedActivity.createdAt,
        updatedAt: updatedActivity.updatedAt,
        animal: {
          id: updatedActivity.animal.id,
          name: updatedActivity.animal.name,
          animalType: updatedActivity.animal.animalType,
          farm: {
            id: updatedActivity.animal.farm.id,
            name: updatedActivity.animal.farm.name,
            owner: {
              id: updatedActivity.animal.farm.owner.id,
              firstName: updatedActivity.animal.farm.owner.firstName,
              lastName: updatedActivity.animal.farm.owner.lastName
            }
          }
        }
      }
    })

  } catch (error) {
    console.error('Activity update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// DELETE /api/activity/[id] - Delete activity
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

    // Verify activity exists and user has access
    const activity = await prisma.activity.findFirst({
      where: {
        id,
        animal: {
          farm: {
            OR: [
              { ownerId: payload.userId },
              { members: { some: { profileId: payload.userId } } }
            ]
          }
        }
      }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Delete activity
    await prisma.activity.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบกิจกรรมเรียบร้อยแล้ว'
    })

  } catch (error) {
    console.error('Activity deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}