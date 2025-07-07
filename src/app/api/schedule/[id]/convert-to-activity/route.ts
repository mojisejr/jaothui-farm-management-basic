import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications/service'

// POST /api/schedule/[id]/convert-to-activity - Convert schedule to activity
export async function POST(
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

    // Parse request body for activity notes/completion details
    const body = await request.json()
    const { notes, activityDate } = body

    // Verify schedule exists and user has access
    const schedule = await prisma.activitySchedule.findFirst({
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

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      )
    }

    // Check if schedule is already completed
    if (schedule.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Schedule is already completed' },
        { status: 400 }
      )
    }

    // Create activity from schedule
    const activity = await prisma.activity.create({
      data: {
        title: schedule.title,
        description: schedule.description,
        notes: notes || `สร้างจากกำหนดการ: ${schedule.title}`,
        activityDate: activityDate ? new Date(activityDate) : new Date(),
        status: 'COMPLETED',
        animalId: schedule.animalId
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

    // Mark schedule as completed
    const updatedSchedule = await prisma.activitySchedule.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    // Create notification for activity completion
    try {
      await NotificationService.createActivityCreatedNotification(activity.id, payload.userId)
    } catch (notificationError) {
      console.error('Failed to create activity completion notification:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'แปลงกำหนดการเป็นกิจกรรมสำเร็จ',
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        notes: activity.notes,
        activityDate: activity.activityDate,
        status: activity.status,
        animalId: activity.animalId,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        animal: {
          id: activity.animal.id,
          name: activity.animal.name,
          animalType: activity.animal.animalType,
          farm: {
            id: activity.animal.farm.id,
            name: activity.animal.farm.name,
            owner: {
              id: activity.animal.farm.owner.id,
              firstName: activity.animal.farm.owner.firstName,
              lastName: activity.animal.farm.owner.lastName
            }
          }
        }
      },
      schedule: {
        id: updatedSchedule.id,
        status: updatedSchedule.status
      }
    })

  } catch (error) {
    console.error('Schedule to activity conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to convert schedule to activity' },
      { status: 500 }
    )
  }
}