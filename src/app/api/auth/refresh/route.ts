import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  verifyRefreshToken,
  generateTokenPair,
  setAuthCookies,
  getRefreshTokenFromCookies,
  clearAuthCookies,
} from '@/lib/jwt'

const prisma = new PrismaClient()

export async function POST(_request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = await getRefreshTokenFromCookies()

    if (!refreshToken) {
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'ไม่พบ refresh token' },
        { status: 401 },
      )
    }

    // Verify refresh token
    const tokenPayload = verifyRefreshToken(refreshToken)
    if (!tokenPayload) {
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'Refresh token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 },
      )
    }

    // Get user data from database to ensure user still exists
    const user = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        phoneVerified: true,
        verified: true,
        createdAt: true,
      },
    })

    if (!user) {
      await clearAuthCookies()
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้' }, { status: 401 })
    }

    // Generate new token pair
    const newTokenPair = generateTokenPair({
      id: user.id,
      phoneNumber: user.phoneNumber || '',
      email: undefined, // Will be available in future updates
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    })

    // Prepare user data for response (without sensitive data)
    const userData = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: null, // Will be available in future updates
      firstName: user.firstName,
      lastName: user.lastName,
      phoneVerified: user.phoneVerified,
      verified: user.verified,
      createdAt: user.createdAt,
    }

    // Return success response with user data
    await setAuthCookies(newTokenPair.accessToken, newTokenPair.refreshToken)

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        user: userData,
        tokens: {
          accessTokenExpiry: newTokenPair.accessTokenExpiry,
          refreshTokenExpiry: newTokenPair.refreshTokenExpiry,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Token refresh error:', error)
    await clearAuthCookies()
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
