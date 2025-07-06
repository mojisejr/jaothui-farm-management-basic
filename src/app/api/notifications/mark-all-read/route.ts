import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// POST /api/notifications/mark-all-read - Mark all notifications as read
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

    // Mark all user's notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: payload.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      updatedCount: result.count,
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}