import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  verifyPassword,
  validateThaiPhoneNumber,
  formatPhoneNumber,
} from '@/lib/password'
import { generateTokenPair, setAuthCookies } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
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

    // Set auth cookies
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken)

    // Return success response (without password hash)
    const { passwordHash: _passwordHash, ...userResponse } = user

    return NextResponse.json(
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
