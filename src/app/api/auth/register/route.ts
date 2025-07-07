import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  hashPassword,
  validatePasswordComplexity,
  validateThaiPhoneNumber,
  validateEmail,
  formatPhoneNumber,
} from '@/lib/password'
import { generateTokenPair, setAuthCookies } from '@/lib/jwt'
import { sendWelcomeEmail } from '@/lib/email'
import { authRateLimiter, applyRateLimit } from '@/lib/rate-limit'

const prisma = new PrismaClient()

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
          error: 'พยายามสมัครสมาชิกมากเกินไป กรุณาลองใหม่ในภายหลัง',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    const body = await request.json()
    const { phoneNumber, password, email, firstName, lastName } = body

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

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
          details: passwordValidation.errors,
        },
        { status: 400 },
      )
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 },
        )
      }
    }

    // Format phone number
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber)

    // Check if phone number already exists
    const existingUserByPhone = await prisma.profile.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว' },
        { status: 409 },
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingUserByEmail = await prisma.profile.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกใช้แล้ว' },
          { status: 409 },
        )
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create new user
    const newUser = await prisma.profile.create({
      data: {
        phoneNumber: formattedPhoneNumber,
        email: email ? email.toLowerCase() : null,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        phoneVerified: false,
        emailVerified: false,
        verified: false,
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneVerified: true,
        emailVerified: true,
        verified: true,
        createdAt: true,
      },
    })

    // Generate JWT tokens
    const tokenPair = generateTokenPair({
      id: newUser.id,
      phoneNumber: newUser.phoneNumber,
      email: newUser.email || undefined,
      firstName: newUser.firstName || undefined,
      lastName: newUser.lastName || undefined,
    })

    // Set auth cookies
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken)

    // Send welcome email if email provided
    if (newUser.email) {
      try {
        await sendWelcomeEmail(newUser.email, {
          firstName: newUser.firstName || undefined,
          phoneNumber: newUser.phoneNumber,
        })
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
        // Don't fail registration if email fails
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'ลงทะเบียนสำเร็จ',
        user: {
          id: newUser.id,
          phoneNumber: newUser.phoneNumber,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneVerified: newUser.phoneVerified,
          emailVerified: newUser.emailVerified,
          verified: newUser.verified,
        },
        tokens: {
          accessTokenExpiry: tokenPair.accessTokenExpiry,
          refreshTokenExpiry: tokenPair.refreshTokenExpiry,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Registration error:', error)

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('phoneNumber')) {
        return NextResponse.json(
          { error: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว' },
          { status: 409 },
        )
      }
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกใช้แล้ว' },
          { status: 409 },
        )
      }
    }

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
