import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
      return baseDate
  }
  
  return nextDate
}

// POST /api/schedule/process-recurring - Process recurring schedules (Cron job)
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron job call
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(now.getDate() + 2)

    // Find recurring schedules that need new instances created
    const recurringSchedules = await prisma.activitySchedule.findMany({
      where: {
        isRecurring: true,
        recurrenceType: { not: null },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        scheduledDate: {
          lte: twoDaysFromNow // Schedules due within 2 days
        }
      },
      include: {
        animal: {
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
        }
      }
    })

    let processedCount = 0
    let createdCount = 0
    const results = []

    for (const schedule of recurringSchedules) {
      if (!schedule.recurrenceType) continue

      try {
        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          schedule.scheduledDate, 
          schedule.recurrenceType
        )

        // Don't create schedules more than 6 months in the future
        const sixMonthsFromNow = new Date()
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
        
        if (nextOccurrence > sixMonthsFromNow) {
          continue
        }

        // Check if a schedule already exists for this date/animal/title
        const existingSchedule = await prisma.activitySchedule.findFirst({
          where: {
            animalId: schedule.animalId,
            title: schedule.title,
            scheduledDate: {
              gte: new Date(nextOccurrence.getTime() - 24 * 60 * 60 * 1000), // 1 day before
              lte: new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
            }
          }
        })

        if (!existingSchedule) {
          // Create new recurring instance
          const newSchedule = await prisma.activitySchedule.create({
            data: {
              title: schedule.title,
              description: schedule.description,
              notes: schedule.notes,
              scheduledDate: nextOccurrence,
              status: 'PENDING',
              isRecurring: true,
              recurrenceType: schedule.recurrenceType,
              animalId: schedule.animalId
            }
          })

          createdCount++

          // Create notification for upcoming schedule (if method exists)
          try {
            // Note: This would need to be implemented in NotificationService
            console.log(`Schedule reminder needed for schedule ${newSchedule.id}`)
          } catch (notificationError) {
            console.error('Failed to create schedule reminder:', notificationError)
          }

          results.push({
            originalScheduleId: schedule.id,
            newScheduleId: newSchedule.id,
            nextOccurrence: nextOccurrence.toISOString(),
            animalName: schedule.animal.name,
            title: schedule.title
          })
        }

        processedCount++

      } catch (scheduleError) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError)
        results.push({
          originalScheduleId: schedule.id,
          error: scheduleError instanceof Error ? scheduleError.message : 'Unknown error'
        })
      }
    }

    // Send summary notification to farm owners if schedules were created
    if (createdCount > 0) {
      const farmOwners = new Set<string>()
      
      recurringSchedules.forEach(schedule => {
        farmOwners.add(schedule.animal.farm.ownerId)
      })

      for (const ownerId of farmOwners) {
        try {
          // Note: This would need to be implemented in NotificationService
          console.log(`Summary notification needed for owner ${ownerId}: ${createdCount} new schedules`)
        } catch (notificationError) {
          console.error('Failed to create summary notification:', notificationError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring schedules processed successfully',
      stats: {
        processedSchedules: processedCount,
        createdSchedules: createdCount,
        totalRecurringSchedules: recurringSchedules.length
      },
      results: results
    })

  } catch (error) {
    console.error('Recurring schedule processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring schedules' },
      { status: 500 }
    )
  }
}