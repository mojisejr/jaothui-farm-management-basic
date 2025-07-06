import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Push subscription schema
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

// POST /api/notifications/push/subscribe - Subscribe to push notifications
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
    const subscription = pushSubscriptionSchema.parse(body)

    // Store push subscription in database
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { userId: payload.userId },
      update: {
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: payload.userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
      },
    })

    // Update user notification preferences to enable push
    await prisma.notificationPreferences.upsert({
      where: { userId: payload.userId },
      update: {
        pushEnabled: true,
        updatedAt: new Date(),
      },
      create: {
        userId: payload.userId,
        pushEnabled: true,
        activityReminders: true,
        overdueAlerts: true,
        farmInvitations: true,
        memberJoined: true,
        newActivities: true,
        emailEnabled: false,
        reminderFrequency: 30,
      },
    })

    console.log(`✅ Push subscription registered for user: ${payload.userId}`)

    return NextResponse.json({
      success: true,
      message: 'เปิดใช้งานการแจ้งเตือนแบบ Push เรียบร้อยแล้ว',
      subscriptionId: pushSubscription.id,
    })
  } catch (error) {
    console.error('Push subscription error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    )
  }
}