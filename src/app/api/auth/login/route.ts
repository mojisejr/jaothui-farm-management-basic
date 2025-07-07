import { NextRequest, NextResponse } from 'next/server'
import {
  verifyPassword,
  validateThaiPhoneNumber,
  formatPhoneNumber,
} from '@/lib/password'
import { generateTokenPair, setAuthCookies } from '@/lib/jwt'
import { authRateLimiter, applyRateLimit } from '@/lib/rate-limit'

import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, authRateLimiter)
    
    if (!rateLimitResult.success) {
      const resetTime = rateLimitResult.reset instanceof Date 
        ? rateLimitResult.reset.getTime() 
        : rateLimitResult.reset
      
      return NextResponse.json(
        { 
          error: 'พยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในภายหลัง',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    const body = await request.json()
    const { phoneNumber, password } = body

    // Input validation
    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์และรหัสผ่านจำเป็นต้องกรอก' },
        { status: 400 },
      )
    }

    // Validate phone number format
    const phoneValidation = validateThaiPhoneNumber(phoneNumber)
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 },
      )
    }

    // Format phone number
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber)

    // Find user by phone number
    const user = await prisma.profile.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        phoneVerified: true,
        emailVerified: true,
        verified: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 },
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 },
      )
    }

    // Generate JWT tokens
    const tokenPair = generateTokenPair({
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    })

    // Return success response (without password hash)
    const { passwordHash: _passwordHash, ...userResponse } = user

    const response = NextResponse.json(
      {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        user: userResponse,
        tokens: {
          accessTokenExpiry: tokenPair.accessTokenExpiry,
          refreshTokenExpiry: tokenPair.refreshTokenExpiry,
        },
      },
      { status: 200 },
    )

    // Set auth cookies
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken)

    return response
  } catch (error) {
    console.error('Login error:', error)
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
