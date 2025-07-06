import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications/service'

// Activity creation schema
const createActivitySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  activityDate: z.string().datetime(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  animalId: z.string().uuid(),
  customFields: z.record(z.string()).optional()
})

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
    const validatedData = createActivitySchema.parse(body)

    // Verify animal exists and user has access
    const animal = await prisma.animal.findFirst({
      where: {
        id: validatedData.animalId,
        farm: {
          OR: [
            { ownerId: payload.userId },
            { members: { some: { profileId: payload.userId } } }
          ]
        }
      },
      include: {
        farm: {
          include: {
            owner: true,
            members: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    if (!animal) {
      return NextResponse.json(
        { error: 'Animal not found or access denied' },
        { status: 404 }
      )
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        notes: validatedData.notes,
        activityDate: new Date(validatedData.activityDate),
        status: validatedData.status,
        animalId: validatedData.animalId
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

    // Trigger notifications for new activity
    try {
      await NotificationService.createActivityCreatedNotification(activity.id, payload.userId)
      
      // Create reminder if activity is in the future
      if (activity.status === 'PENDING' && new Date(activity.activityDate) > new Date()) {
        await NotificationService.createActivityReminder(activity.id, 30)
      }
    } catch (notificationError) {
      console.error('Failed to create activity notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      { 
        success: true, 
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
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Activity creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}