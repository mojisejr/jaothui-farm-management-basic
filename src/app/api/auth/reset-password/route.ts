import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  validateEmail,
  generateResetToken,
  generateResetTokenExpiry,
} from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email'
import { strictRateLimiter, applyRateLimit } from '@/lib/rate-limit'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for password reset
    const rateLimitResult = await applyRateLimit(request, strictRateLimiter)
    
    if (!rateLimitResult.success) {
      const resetTime = rateLimitResult.reset instanceof Date 
        ? rateLimitResult.reset.getTime() 
        : rateLimitResult.reset
      
      return NextResponse.json(
        { 
          error: 'พยายามรีเซ็ตรหัสผ่านมากเกินไป กรุณาลองใหม่ในภายหลัง',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    const body = await request.json()
    const { email } = body

    // Input validation
    if (!email) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 })
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
      },
    })

    // Always return success message for security reasons
    // (Don't reveal whether email exists or not)
    const successMessage =
      'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้'

    if (!user) {
      // User doesn't exist, but return success message anyway
      return NextResponse.json(
        {
          success: true,
          message: successMessage,
        },
        { status: 200 },
      )
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken()
    const resetTokenExpiry = generateResetTokenExpiry()

    // Update user with reset token
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Send password reset email
    try {
      const emailResult = await sendPasswordResetEmail(
        user.email!,
        resetToken,
        {
          firstName: user.firstName || undefined,
          phoneNumber: user.phoneNumber,
        },
      )

      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error)
        // Don't expose email sending errors to user
      }
    } catch (emailError) {
      console.error('Password reset email error:', emailError)
      // Don't expose email sending errors to user
    }

    // Always return success
    return NextResponse.json(
      {
        success: true,
        message: successMessage,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Password reset error:', error)
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
