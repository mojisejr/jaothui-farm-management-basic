import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Schedule creation schema
const createScheduleSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.string().optional(),
  animalId: z.string().uuid(),
  customFields: z.record(z.string()).optional()
}).refine((data) => {
  // If recurring, recurrence type is required
  if (data.isRecurring && !data.recurrenceType) {
    return false
  }
  return true
}, {
  message: 'Recurrence type is required when isRecurring is true',
  path: ['recurrenceType']
})

// Helper function to calculate next occurrence date
function calculateNextOccurrence(baseDate: Date, recurrenceType: string): Date {
  const nextDate = new Date(baseDate)
  
  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      // No recurrence
      return baseDate
  }
  
  return nextDate
}

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
    const validatedData = createScheduleSchema.parse(body)

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

    // Create main schedule
    const schedule = await prisma.activitySchedule.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        notes: validatedData.notes,
        scheduledDate: new Date(validatedData.scheduledDate),
        status: validatedData.status,
        isRecurring: validatedData.isRecurring,
        recurrenceType: validatedData.recurrenceType,
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

    // If recurring, create next few occurrences (up to 5 future instances)
    const additionalSchedules = []
    if (validatedData.isRecurring && validatedData.recurrenceType) {
      let currentDate = new Date(validatedData.scheduledDate)
      
      for (let i = 0; i < 5; i++) {
        currentDate = calculateNextOccurrence(currentDate, validatedData.recurrenceType)
        
        // Don't create schedules more than 2 years in the future
        const twoYearsFromNow = new Date()
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
        
        if (currentDate > twoYearsFromNow) {
          break
        }

        const additionalSchedule = await prisma.activitySchedule.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            notes: validatedData.notes,
            scheduledDate: currentDate,
            status: 'PENDING',
            isRecurring: true,
            recurrenceType: validatedData.recurrenceType,
            animalId: validatedData.animalId
          }
        })
        
        additionalSchedules.push(additionalSchedule)
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        schedule: {
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          notes: schedule.notes,
          scheduledDate: schedule.scheduledDate,
          status: schedule.status,
          isRecurring: schedule.isRecurring,
          recurrenceType: schedule.recurrenceType,
          animalId: schedule.animalId,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          animal: {
            id: schedule.animal.id,
            name: schedule.animal.name,
            animalType: schedule.animal.animalType,
            farm: {
              id: schedule.animal.farm.id,
              name: schedule.animal.farm.name,
              owner: {
                id: schedule.animal.farm.owner.id,
                firstName: schedule.animal.farm.owner.firstName,
                lastName: schedule.animal.farm.owner.lastName
              }
            }
          }
        },
        additionalSchedules: additionalSchedules.length > 0 ? {
          count: additionalSchedules.length,
          message: `สร้างกำหนดการซ้ำ ${additionalSchedules.length} ครั้งเพิ่มเติม`
        } : null
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Schedule creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}