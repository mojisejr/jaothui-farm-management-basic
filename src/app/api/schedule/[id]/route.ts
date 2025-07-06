import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Update schedule schema
const updateScheduleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.string().optional(),
  customFields: z.record(z.string()).optional()
})

// GET /api/schedule/[id] - Get schedule details
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

    // Get schedule with access verification
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

    return NextResponse.json({ schedule })

  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule/[id] - Update schedule
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
    const validatedData = updateScheduleSchema.parse(body)

    // Verify schedule exists and user has access
    const existingSchedule = await prisma.activitySchedule.findFirst({
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

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      )
    }

    // Update schedule
    const updatedSchedule = await prisma.activitySchedule.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.scheduledDate && { scheduledDate: new Date(validatedData.scheduledDate) }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.isRecurring !== undefined && { isRecurring: validatedData.isRecurring }),
        ...(validatedData.recurrenceType !== undefined && { recurrenceType: validatedData.recurrenceType }),
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

    return NextResponse.json({
      success: true,
      schedule: {
        id: updatedSchedule.id,
        title: updatedSchedule.title,
        description: updatedSchedule.description,
        notes: updatedSchedule.notes,
        scheduledDate: updatedSchedule.scheduledDate,
        status: updatedSchedule.status,
        isRecurring: updatedSchedule.isRecurring,
        recurrenceType: updatedSchedule.recurrenceType,
        animalId: updatedSchedule.animalId,
        createdAt: updatedSchedule.createdAt,
        updatedAt: updatedSchedule.updatedAt,
        animal: {
          id: updatedSchedule.animal.id,
          name: updatedSchedule.animal.name,
          animalType: updatedSchedule.animal.animalType,
          farm: {
            id: updatedSchedule.animal.farm.id,
            name: updatedSchedule.animal.farm.name,
            owner: {
              id: updatedSchedule.animal.farm.owner.id,
              firstName: updatedSchedule.animal.farm.owner.firstName,
              lastName: updatedSchedule.animal.farm.owner.lastName
            }
          }
        }
      }
    })

  } catch (error) {
    console.error('Schedule update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/[id] - Delete schedule
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
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      )
    }

    // Delete schedule
    await prisma.activitySchedule.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบกำหนดการเรียบร้อยแล้ว'
    })

  } catch (error) {
    console.error('Schedule deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}