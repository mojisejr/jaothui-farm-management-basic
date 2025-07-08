import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Daily System Tasks - Unified Cron Job
 * Runs once daily to handle all scheduled maintenance:
 * 1. Process recurring schedules
 * 2. Send notifications (reminders, overdue alerts)
 * 3. Clean up expired invitations
 */
export async function GET(_req: NextRequest) {
  try {
    console.log('[DAILY-TASKS] Starting daily system tasks...')
    const startTime = Date.now()
    const results = {
      recurringSchedules: 0,
      notificationsSent: 0,
      invitationsCleanedUp: 0,
      errors: [] as string[]
    }

    // === TASK 1: Process Recurring Schedules ===
    try {
      console.log('[DAILY-TASKS] 1. Processing recurring schedules...')
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Find recurring schedules that need to be processed today
      const recurringSchedules = await prisma.activitySchedule.findMany({
        where: {
          isRecurring: true,
          status: 'PENDING',
          scheduledDate: {
            lte: today
          }
        },
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      })

      for (const schedule of recurringSchedules) {
        try {
          let nextDate: Date | null = null
          const scheduledDate = new Date(schedule.scheduledDate)

          // Calculate next occurrence based on recurrence type
          switch (schedule.recurrenceType) {
            case 'DAILY':
              nextDate = new Date(scheduledDate)
              nextDate.setDate(nextDate.getDate() + 1)
              break
            case 'WEEKLY':
              nextDate = new Date(scheduledDate)
              nextDate.setDate(nextDate.getDate() + 7)
              break
            case 'MONTHLY':
              nextDate = new Date(scheduledDate)
              nextDate.setMonth(nextDate.getMonth() + 1)
              break
            case 'YEARLY':
              nextDate = new Date(scheduledDate)
              nextDate.setFullYear(nextDate.getFullYear() + 1)
              break
          }

          if (nextDate) {
            // Create new schedule for next occurrence
            await prisma.activitySchedule.create({
              data: {
                title: schedule.title,
                description: schedule.description,
                notes: schedule.notes,
                scheduledDate: nextDate,
                status: 'PENDING',
                isRecurring: true,
                recurrenceType: schedule.recurrenceType,
                animalId: schedule.animalId
              }
            })

            // Mark current schedule as completed
            await prisma.activitySchedule.update({
              where: { id: schedule.id },
              data: { status: 'COMPLETED' }
            })

            results.recurringSchedules++
          }
        } catch (error) {
          console.error(`[DAILY-TASKS] Error processing schedule ${schedule.id}:`, error)
          results.errors.push(`Recurring schedule ${schedule.id}: ${error}`)
        }
      }

      console.log(`[DAILY-TASKS] ✓ Processed ${results.recurringSchedules} recurring schedules`)
    } catch (error) {
      console.error('[DAILY-TASKS] Error in recurring schedules task:', error)
      results.errors.push(`Recurring schedules: ${error}`)
    }

    // === TASK 2: Send Notifications ===
    try {
      console.log('[DAILY-TASKS] 2. Processing notifications...')
      
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Find pending schedules that need reminders
      const upcomingSchedules = await prisma.activitySchedule.findMany({
        where: {
          status: 'PENDING',
          scheduledDate: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          animal: {
            include: {
              animalType: true,
              farm: {
                include: {
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

      // Find overdue schedules
      const overdueSchedules = await prisma.activitySchedule.findMany({
        where: {
          status: 'PENDING',
          scheduledDate: {
            lt: today
          }
        },
        include: {
          animal: {
            include: {
              animalType: true,
              farm: {
                include: {
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

      // Send reminder notifications
      for (const schedule of upcomingSchedules) {
        try {
          for (const member of schedule.animal.farm.members) {
            await prisma.notification.create({
              data: {
                type: 'SCHEDULE_REMINDER',
                title: `เตือนกำหนดการ: ${schedule.title}`,
                message: `กำหนดการ "${schedule.title}" สำหรับ ${schedule.animal.name} (${schedule.animal.animalType?.name}) ครบกำหนดวันนี้`,
                userId: member.profileId,
                farmId: schedule.animal.farm.id,
                relatedEntityType: 'schedule',
                relatedEntityId: schedule.id,
                priority: 'NORMAL',
                isRead: false
              }
            })
          }
          results.notificationsSent++
        } catch (error) {
          console.error(`[DAILY-TASKS] Error sending reminder for schedule ${schedule.id}:`, error)
          results.errors.push(`Reminder notification ${schedule.id}: ${error}`)
        }
      }

      // Send overdue notifications
      for (const schedule of overdueSchedules) {
        try {
          for (const member of schedule.animal.farm.members) {
            await prisma.notification.create({
              data: {
                type: 'ACTIVITY_OVERDUE',
                title: `เกินกำหนด: ${schedule.title}`,
                message: `กำหนดการ "${schedule.title}" สำหรับ ${schedule.animal.name} (${schedule.animal.animalType?.name}) เกินกำหนดแล้ว`,
                userId: member.profileId,
                farmId: schedule.animal.farm.id,
                relatedEntityType: 'schedule',
                relatedEntityId: schedule.id,
                priority: 'HIGH',
                isRead: false
              }
            })
          }
          results.notificationsSent++
        } catch (error) {
          console.error(`[DAILY-TASKS] Error sending overdue notification for schedule ${schedule.id}:`, error)
          results.errors.push(`Overdue notification ${schedule.id}: ${error}`)
        }
      }

      console.log(`[DAILY-TASKS] ✓ Sent ${results.notificationsSent} notifications`)
    } catch (error) {
      console.error('[DAILY-TASKS] Error in notifications task:', error)
      results.errors.push(`Notifications: ${error}`)
    }

    // === TASK 3: Clean Up Expired Invitations ===
    try {
      console.log('[DAILY-TASKS] 3. Cleaning up expired invitations...')
      
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Delete expired invitations (older than 7 days)
      const deletedInvitations = await prisma.invitation.deleteMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      })

      results.invitationsCleanedUp = deletedInvitations.count

      console.log(`[DAILY-TASKS] ✓ Cleaned up ${results.invitationsCleanedUp} expired invitations`)
    } catch (error) {
      console.error('[DAILY-TASKS] Error in invitation cleanup task:', error)
      results.errors.push(`Invitation cleanup: ${error}`)
    }

    // === SUMMARY ===
    const duration = Date.now() - startTime
    console.log(`[DAILY-TASKS] ✅ Daily tasks completed in ${duration}ms`)
    console.log(`[DAILY-TASKS] Summary:`, {
      recurringSchedules: results.recurringSchedules,
      notificationsSent: results.notificationsSent,
      invitationsCleanedUp: results.invitationsCleanedUp,
      errors: results.errors.length
    })

    return NextResponse.json({
      success: true,
      message: 'Daily system tasks completed successfully',
      data: {
        duration: `${duration}ms`,
        results: {
          recurringSchedulesProcessed: results.recurringSchedules,
          notificationsSent: results.notificationsSent,
          invitationsCleanedUp: results.invitationsCleanedUp,
          errorsCount: results.errors.length,
          errors: results.errors
        }
      }
    })

  } catch (error) {
    console.error('[DAILY-TASKS] ❌ Fatal error in daily tasks:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Daily system tasks failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Optional: Allow manual triggering with POST for testing
export async function POST(_req: NextRequest) {
  // Only allow in development or with proper authorization
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return NextResponse.json({
      success: false,
      message: 'Manual triggering not allowed in production'
    }, { status: 403 })
  }

  console.log('[DAILY-TASKS] Manual trigger requested')
  return GET(_req)
}