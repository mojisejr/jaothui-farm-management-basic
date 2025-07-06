import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// POST /api/notifications/push/unsubscribe - Unsubscribe from push notifications
export async function POST(_request: NextRequest) {
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

    // Remove push subscription from database
    await prisma.pushSubscription.deleteMany({
      where: { userId: payload.userId },
    })

    // Update user notification preferences to disable push
    await prisma.notificationPreferences.updateMany({
      where: { userId: payload.userId },
      data: {
        pushEnabled: false,
        updatedAt: new Date(),
      },
    })

    console.log(`❌ Push subscription removed for user: ${payload.userId}`)

    return NextResponse.json({
      success: true,
      message: 'ปิดการแจ้งเตือนแบบ Push เรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    )
  }
}