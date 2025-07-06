import prisma from '@/lib/prisma'

// Notification creation service
export interface CreateNotificationParams {
  userId: string
  type: 'ACTIVITY_REMINDER' | 'ACTIVITY_OVERDUE' | 'SCHEDULE_REMINDER' | 'FARM_INVITATION' | 'MEMBER_JOINED' | 'ACTIVITY_COMPLETED' | 'ACTIVITY_CREATED' | 'SYSTEM_ANNOUNCEMENT'
  title: string
  message: string
  data?: Record<string, unknown>
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  scheduledAt?: Date
  farmId?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export class NotificationService {
  // Create a single notification
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          data: (params.data as object) || {},
          priority: params.priority || 'NORMAL',
          scheduledAt: params.scheduledAt,
          farmId: params.farmId,
          relatedEntityType: params.relatedEntityType,
          relatedEntityId: params.relatedEntityId,
        },
      })

      console.log(`✅ Created notification: ${params.type} for user ${params.userId}`)
      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Create notifications for multiple users
  static async createBulkNotifications(
    userIds: string[],
    params: Omit<CreateNotificationParams, 'userId'>
  ) {
    try {
      const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: params.type,
          title: params.title,
          message: params.message,
          data: (params.data as object) || {},
          priority: params.priority || 'NORMAL',
          scheduledAt: params.scheduledAt,
          farmId: params.farmId,
          relatedEntityType: params.relatedEntityType,
          relatedEntityId: params.relatedEntityId,
        })),
      })

      console.log(`✅ Created ${notifications.count} bulk notifications: ${params.type}`)
      return notifications
    } catch (error) {
      console.error('Failed to create bulk notifications:', error)
      throw error
    }
  }

  // Get farm members for notifications
  static async getFarmMembers(farmId: string): Promise<string[]> {
    try {
      const farmMembers = await prisma.farmMember.findMany({
        where: { farmId },
        select: { profileId: true },
      })

      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: { ownerId: true },
      })

      const memberIds = farmMembers.map(member => member.profileId)
      
      // Include farm owner if not already a member
      if (farm?.ownerId && !memberIds.includes(farm.ownerId)) {
        memberIds.push(farm.ownerId)
      }

      return memberIds
    } catch (error) {
      console.error('Failed to get farm members:', error)
      return []
    }
  }

  // Activity reminder notifications
  static async createActivityReminder(
    activityId: string,
    reminderMinutes: number = 30
  ) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          animal: {
            include: {
              farm: {
                include: {
                  owner: true,
                  members: {
                    include: { profile: true }
                  }
                }
              }
            }
          }
        }
      })

      if (!activity || activity.status !== 'PENDING') {
        return null
      }

      // Calculate reminder time
      const reminderTime = new Date(activity.activityDate)
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes)

      // Don't create reminders for past activities
      if (reminderTime <= new Date()) {
        return null
      }

      const farmMembers = await this.getFarmMembers(activity.animal.farmId)

      return await this.createBulkNotifications(farmMembers, {
        type: 'ACTIVITY_REMINDER',
        title: `เตือน: ${activity.title}`,
        message: `กิจกรรม "${activity.title}" สำหรับ ${activity.animal.name} จะครบกำหนดในอีก ${reminderMinutes} นาที`,
        data: {
          activityId: activity.id,
          animalId: activity.animalId,
          animalName: activity.animal.name,
          scheduledDate: activity.activityDate,
          reminderMinutes,
        },
        priority: 'NORMAL',
        scheduledAt: reminderTime,
        farmId: activity.animal.farmId,
        relatedEntityType: 'activity',
        relatedEntityId: activity.id,
      })
    } catch (error) {
      console.error('Failed to create activity reminder:', error)
      throw error
    }
  }

  // Schedule reminder notifications
  static async createScheduleReminder(
    scheduleId: string,
    reminderMinutes: number = 30
  ) {
    try {
      const schedule = await prisma.activitySchedule.findUnique({
        where: { id: scheduleId },
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      })

      if (!schedule || schedule.status !== 'PENDING') {
        return null
      }

      // Calculate reminder time
      const reminderTime = new Date(schedule.scheduledDate)
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes)

      // Don't create reminders for past schedules
      if (reminderTime <= new Date()) {
        return null
      }

      const farmMembers = await this.getFarmMembers(schedule.animal.farmId)

      return await this.createBulkNotifications(farmMembers, {
        type: 'SCHEDULE_REMINDER',
        title: `เตือน: ${schedule.title}`,
        message: `กำหนดการ "${schedule.title}" สำหรับ ${schedule.animal.name} จะครบกำหนดในอีก ${reminderMinutes} นาที`,
        data: {
          scheduleId: schedule.id,
          animalId: schedule.animalId,
          animalName: schedule.animal.name,
          scheduledDate: schedule.scheduledDate,
          reminderMinutes,
          isRecurring: schedule.isRecurring,
        },
        priority: 'NORMAL',
        scheduledAt: reminderTime,
        farmId: schedule.animal.farmId,
        relatedEntityType: 'schedule',
        relatedEntityId: schedule.id,
      })
    } catch (error) {
      console.error('Failed to create schedule reminder:', error)
      throw error
    }
  }

  // Overdue activity notifications
  static async createOverdueNotification(activityId: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      })

      if (!activity || activity.status !== 'PENDING') {
        return null
      }

      // Check if activity is actually overdue
      if (new Date(activity.activityDate) > new Date()) {
        return null
      }

      const farmMembers = await this.getFarmMembers(activity.animal.farmId)

      // Calculate how overdue it is
      const overdueDays = Math.floor(
        (new Date().getTime() - new Date(activity.activityDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      return await this.createBulkNotifications(farmMembers, {
        type: 'ACTIVITY_OVERDUE',
        title: `เกินกำหนด: ${activity.title}`,
        message: `กิจกรรม "${activity.title}" สำหรับ ${activity.animal.name} เกินกำหนดมาแล้ว ${overdueDays} วัน`,
        data: {
          activityId: activity.id,
          animalId: activity.animalId,
          animalName: activity.animal.name,
          originalDate: activity.activityDate,
          overdueDays,
        },
        priority: overdueDays > 7 ? 'URGENT' : overdueDays > 3 ? 'HIGH' : 'NORMAL',
        farmId: activity.animal.farmId,
        relatedEntityType: 'activity',
        relatedEntityId: activity.id,
      })
    } catch (error) {
      console.error('Failed to create overdue notification:', error)
      throw error
    }
  }

  // Farm invitation notifications
  static async createFarmInvitationNotification(
    inviteePhoneNumber: string,
    farmId: string,
    inviterName: string
  ) {
    try {
      // Find user by phone number
      const invitee = await prisma.profile.findUnique({
        where: { phoneNumber: inviteePhoneNumber },
      })

      if (!invitee) {
        console.log(`User with phone ${inviteePhoneNumber} not found - skipping notification`)
        return null
      }

      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: { name: true },
      })

      if (!farm) {
        throw new Error('Farm not found')
      }

      return await this.createNotification({
        userId: invitee.id,
        type: 'FARM_INVITATION',
        title: 'เชิญเข้าร่วมฟาร์ม',
        message: `${inviterName} เชิญคุณเข้าร่วมฟาร์ม "${farm.name}"`,
        data: {
          farmId,
          farmName: farm.name,
          inviterName,
          inviteePhoneNumber,
        },
        priority: 'NORMAL',
        farmId,
        relatedEntityType: 'farm',
        relatedEntityId: farmId,
      })
    } catch (error) {
      console.error('Failed to create farm invitation notification:', error)
      throw error
    }
  }

  // Member joined notifications
  static async createMemberJoinedNotification(
    farmId: string,
    newMemberName: string,
    newMemberId: string
  ) {
    try {
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: { name: true },
      })

      if (!farm) {
        throw new Error('Farm not found')
      }

      const farmMembers = await this.getFarmMembers(farmId)
      
      // Don't notify the new member about themselves
      const notifyMembers = farmMembers.filter(memberId => memberId !== newMemberId)

      return await this.createBulkNotifications(notifyMembers, {
        type: 'MEMBER_JOINED',
        title: 'สมาชิกใหม่เข้าร่วมฟาร์ม',
        message: `${newMemberName} เข้าร่วมฟาร์ม "${farm.name}" แล้ว`,
        data: {
          farmId,
          farmName: farm.name,
          newMemberName,
          newMemberId,
        },
        priority: 'LOW',
        farmId,
        relatedEntityType: 'farm',
        relatedEntityId: farmId,
      })
    } catch (error) {
      console.error('Failed to create member joined notification:', error)
      throw error
    }
  }

  // Activity completed notifications
  static async createActivityCompletedNotification(
    activityId: string,
    completedByUserId: string
  ) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      })

      if (!activity) {
        throw new Error('Activity not found')
      }

      const completedBy = await prisma.profile.findUnique({
        where: { id: completedByUserId },
        select: { firstName: true, lastName: true, phoneNumber: true },
      })

      const completedByName = completedBy 
        ? `${completedBy.firstName || ''} ${completedBy.lastName || ''}`.trim() || completedBy.phoneNumber
        : 'สมาชิกฟาร์ม'

      const farmMembers = await this.getFarmMembers(activity.animal.farmId)
      
      // Don't notify the person who completed it
      const notifyMembers = farmMembers.filter(memberId => memberId !== completedByUserId)

      return await this.createBulkNotifications(notifyMembers, {
        type: 'ACTIVITY_COMPLETED',
        title: `กิจกรรมเสร็จสิ้น: ${activity.title}`,
        message: `${completedByName} ทำกิจกรรม "${activity.title}" สำหรับ ${activity.animal.name} เสร็จแล้ว`,
        data: {
          activityId: activity.id,
          animalId: activity.animalId,
          animalName: activity.animal.name,
          completedBy: completedByName,
          completedAt: new Date().toISOString(),
        },
        priority: 'LOW',
        farmId: activity.animal.farmId,
        relatedEntityType: 'activity',
        relatedEntityId: activity.id,
      })
    } catch (error) {
      console.error('Failed to create activity completed notification:', error)
      throw error
    }
  }

  // Activity created notifications
  static async createActivityCreatedNotification(
    activityId: string,
    createdByUserId: string
  ) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      })

      if (!activity) {
        throw new Error('Activity not found')
      }

      const createdBy = await prisma.profile.findUnique({
        where: { id: createdByUserId },
        select: { firstName: true, lastName: true, phoneNumber: true },
      })

      const createdByName = createdBy 
        ? `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim() || createdBy.phoneNumber
        : 'สมาชิกฟาร์ม'

      const farmMembers = await this.getFarmMembers(activity.animal.farmId)
      
      // Don't notify the person who created it
      const notifyMembers = farmMembers.filter(memberId => memberId !== createdByUserId)

      return await this.createBulkNotifications(notifyMembers, {
        type: 'ACTIVITY_CREATED',
        title: `กิจกรรมใหม่: ${activity.title}`,
        message: `${createdByName} เพิ่มกิจกรรม "${activity.title}" สำหรับ ${activity.animal.name}`,
        data: {
          activityId: activity.id,
          animalId: activity.animalId,
          animalName: activity.animal.name,
          createdBy: createdByName,
          activityDate: activity.activityDate,
        },
        priority: 'LOW',
        farmId: activity.animal.farmId,
        relatedEntityType: 'activity',
        relatedEntityId: activity.id,
      })
    } catch (error) {
      console.error('Failed to create activity created notification:', error)
      throw error
    }
  }

  // System announcement notifications
  static async createSystemAnnouncement(
    title: string,
    message: string,
    targetFarmIds?: string[],
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) {
    try {
      let targetUserIds: string[] = []

      if (targetFarmIds && targetFarmIds.length > 0) {
        // Get all members of specified farms
        for (const farmId of targetFarmIds) {
          const farmMembers = await this.getFarmMembers(farmId)
          targetUserIds.push(...farmMembers)
        }
        
        // Remove duplicates
        targetUserIds = [...new Set(targetUserIds)]
      } else {
        // Get all users
        const allUsers = await prisma.profile.findMany({
          select: { id: true },
        })
        targetUserIds = allUsers.map(user => user.id)
      }

      return await this.createBulkNotifications(targetUserIds, {
        type: 'SYSTEM_ANNOUNCEMENT',
        title,
        message,
        data: {
          targetFarmIds,
          announcementDate: new Date().toISOString(),
        },
        priority,
      })
    } catch (error) {
      console.error('Failed to create system announcement:', error)
      throw error
    }
  }
}

export default NotificationService