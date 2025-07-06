import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// DELETE /api/notifications/clear-all - Clear all notifications
export async function DELETE(_request: NextRequest) {
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

    // Delete all user's notifications
    const result = await prisma.notification.deleteMany({
      where: {
        userId: payload.userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} notifications`,
      deletedCount: result.count,
    })
  } catch (error) {
    console.error('Clear all notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    )
  }
}