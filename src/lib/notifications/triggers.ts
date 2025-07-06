import prisma from '@/lib/prisma'
import { NotificationService } from './service'

// Notification trigger system for automatic notifications
export class NotificationTriggers {
  
  // Check for overdue activities and create notifications
  static async checkOverdueActivities() {
    try {
      const now = new Date()
      
      // Find activities that are overdue but still pending
      const overdueActivities = await prisma.activity.findMany({
        where: {
          status: 'PENDING',
          activityDate: {
            lt: now
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

      console.log(`🔍 Found ${overdueActivities.length} overdue activities`)

      // Check if we've already sent overdue notifications for these activities
      const results = []
      for (const activity of overdueActivities) {
        // Check if overdue notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'ACTIVITY_OVERDUE',
            relatedEntityType: 'activity',
            relatedEntityId: activity.id,
          }
        })

        if (!existingNotification) {
          const result = await NotificationService.createOverdueNotification(activity.id)
          if (result) {
            results.push(result)
          }
        }
      }

      console.log(`✅ Created ${results.length} overdue notifications`)
      return results
    } catch (error) {
      console.error('Failed to check overdue activities:', error)
      throw error
    }
  }

  // Check for upcoming activities and create reminder notifications
  static async checkUpcomingActivities(reminderMinutes: number = 30) {
    try {
      const now = new Date()
      const reminderTime = new Date(now.getTime() + (reminderMinutes * 60 * 1000))
      
      // Find activities that will be due within the reminder window
      const upcomingActivities = await prisma.activity.findMany({
        where: {
          status: 'PENDING',
          activityDate: {
            gte: now,
            lte: reminderTime
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

      console.log(`🔍 Found ${upcomingActivities.length} upcoming activities`)

      // Check if we've already sent reminders for these activities
      const results = []
      for (const activity of upcomingActivities) {
        // Check if reminder notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'ACTIVITY_REMINDER',
            relatedEntityType: 'activity',
            relatedEntityId: activity.id,
          }
        })

        if (!existingNotification) {
          const result = await NotificationService.createActivityReminder(activity.id, reminderMinutes)
          if (result) {
            results.push(result)
          }
        }
      }

      console.log(`✅ Created ${results.length} activity reminder notifications`)
      return results
    } catch (error) {
      console.error('Failed to check upcoming activities:', error)
      throw error
    }
  }

  // Check for upcoming schedules and create reminder notifications
  static async checkUpcomingSchedules(reminderMinutes: number = 30) {
    try {
      const now = new Date()
      const reminderTime = new Date(now.getTime() + (reminderMinutes * 60 * 1000))
      
      // Find schedules that will be due within the reminder window
      const upcomingSchedules = await prisma.activitySchedule.findMany({
        where: {
          status: 'PENDING',
          scheduledDate: {
            gte: now,
            lte: reminderTime
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

      console.log(`🔍 Found ${upcomingSchedules.length} upcoming schedules`)

      // Check if we've already sent reminders for these schedules
      const results = []
      for (const schedule of upcomingSchedules) {
        // Check if reminder notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'SCHEDULE_REMINDER',
            relatedEntityType: 'schedule',
            relatedEntityId: schedule.id,
          }
        })

        if (!existingNotification) {
          const result = await NotificationService.createScheduleReminder(schedule.id, reminderMinutes)
          if (result) {
            results.push(result)
          }
        }
      }

      console.log(`✅ Created ${results.length} schedule reminder notifications`)
      return results
    } catch (error) {
      console.error('Failed to check upcoming schedules:', error)
      throw error
    }
  }

  // Process invitation notifications
  static async processInvitationNotifications() {
    try {
      // Find pending invitations that haven't been processed for notifications
      const pendingInvitations = await prisma.invitation.findMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          farm: true,
          inviter: true
        }
      })

      console.log(`🔍 Found ${pendingInvitations.length} pending invitations`)

      const results = []
      for (const invitation of pendingInvitations) {
        // Check if notification already exists for this invitation
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'FARM_INVITATION',
            data: {
              path: ['farmId'],
              equals: invitation.farmId
            },
            // Find by phone number in the data
            AND: {
              data: {
                path: ['inviteePhoneNumber'],
                equals: invitation.phoneNumber
              }
            }
          }
        })

        if (!existingNotification) {
          const inviterName = invitation.inviter.firstName || invitation.inviter.lastName
            ? `${invitation.inviter.firstName || ''} ${invitation.inviter.lastName || ''}`.trim()
            : invitation.inviter.phoneNumber

          const result = await NotificationService.createFarmInvitationNotification(
            invitation.phoneNumber,
            invitation.farmId,
            inviterName
          )
          
          if (result) {
            results.push(result)
          }
        }
      }

      console.log(`✅ Created ${results.length} invitation notifications`)
      return results
    } catch (error) {
      console.error('Failed to process invitation notifications:', error)
      throw error
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications(daysToKeep: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const deletedCount = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true // Only delete read notifications
        }
      })

      console.log(`🧹 Cleaned up ${deletedCount.count} old notifications`)
      return deletedCount
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error)
      throw error
    }
  }

  // Run all notification checks
  static async runAllChecks() {
    console.log('🚀 Starting notification trigger checks...')
    
    try {
      const results = await Promise.allSettled([
        this.checkOverdueActivities(),
        this.checkUpcomingActivities(30), // 30 minutes reminder
        this.checkUpcomingSchedules(30), // 30 minutes reminder
        this.processInvitationNotifications(),
        this.cleanupOldNotifications(30), // Keep 30 days
      ])

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`✅ Notification checks completed: ${successful} successful, ${failed} failed`)
      
      // Log any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Check ${index} failed:`, result.reason)
        }
      })

      return results
    } catch (error) {
      console.error('Failed to run notification checks:', error)
      throw error
    }
  }

  // Get notification preferences for a user
  static async getUserNotificationPreferences(userId: string) {
    try {
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId }
      })

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: {
            userId,
            activityReminders: true,
            overdueAlerts: true,
            farmInvitations: true,
            memberJoined: true,
            newActivities: true,
            pushEnabled: false,
            emailEnabled: false,
            reminderFrequency: 30,
          }
        })
      }

      return preferences
    } catch (error) {
      console.error('Failed to get user notification preferences:', error)
      throw error
    }
  }

  // Check if user should receive notification based on preferences
  static async shouldNotifyUser(userId: string, notificationType: string): Promise<boolean> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId)
      
      switch (notificationType) {
        case 'ACTIVITY_REMINDER':
          return preferences.activityReminders
        case 'ACTIVITY_OVERDUE':
          return preferences.overdueAlerts
        case 'SCHEDULE_REMINDER':
          return preferences.activityReminders
        case 'FARM_INVITATION':
          return preferences.farmInvitations
        case 'MEMBER_JOINED':
          return preferences.memberJoined
        case 'ACTIVITY_COMPLETED':
        case 'ACTIVITY_CREATED':
          return preferences.newActivities
        case 'SYSTEM_ANNOUNCEMENT':
          return true // Always send system announcements
        default:
          return true
      }
    } catch (error) {
      console.error('Failed to check notification preferences:', error)
      return true // Default to sending notification if check fails
    }
  }

  // Check quiet hours
  static isQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) {
      return false
    }

    try {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      
      const [startHour, startMinute] = quietStart.split(':').map(Number)
      const [endHour, endMinute] = quietEnd.split(':').map(Number)
      
      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute
      
      // Handle overnight quiet hours (e.g., 22:00 to 07:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime
      } else {
        return currentTime >= startTime && currentTime <= endTime
      }
    } catch (error) {
      console.error('Failed to check quiet hours:', error)
      return false
    }
  }
}

export default NotificationTriggers