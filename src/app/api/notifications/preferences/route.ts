import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Notification preferences schema
const updatePreferencesSchema = z.object({
  activityReminders: z.boolean().optional(),
  overdueAlerts: z.boolean().optional(),
  farmInvitations: z.boolean().optional(),
  memberJoined: z.boolean().optional(),
  newActivities: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  reminderFrequency: z.number().min(1).max(1440).optional(), // 1 minute to 24 hours
  quietStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  quietEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
})

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(_request: NextRequest) {
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

    // Get or create user preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: payload.userId }
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: payload.userId,
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

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
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
    const validatedData = updatePreferencesSchema.parse(body)

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: payload.userId },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        userId: payload.userId,
        activityReminders: validatedData.activityReminders ?? true,
        overdueAlerts: validatedData.overdueAlerts ?? true,
        farmInvitations: validatedData.farmInvitations ?? true,
        memberJoined: validatedData.memberJoined ?? true,
        newActivities: validatedData.newActivities ?? true,
        pushEnabled: validatedData.pushEnabled ?? false,
        emailEnabled: validatedData.emailEnabled ?? false,
        reminderFrequency: validatedData.reminderFrequency ?? 30,
        quietHoursStart: validatedData.quietStart,
        quietHoursEnd: validatedData.quietEnd,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าแจ้งเตือนเรียบร้อยแล้ว',
      preferences
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}