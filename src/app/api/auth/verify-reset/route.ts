import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  hashPassword,
  validatePasswordComplexity,
  isResetTokenExpired,
} from '@/lib/password'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Input validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอก token และรหัสผ่านใหม่' },
        { status: 400 },
      )
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
          details: passwordValidation.errors,
        },
        { status: 400 },
      )
    }

    // Find user by reset token
    const user = await prisma.profile.findFirst({
      where: {
        resetToken: token,
      },
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiry: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 400 },
      )
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || isResetTokenExpired(user.resetTokenExpiry)) {
      // Clear expired token
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      return NextResponse.json(
        { error: 'Token หมดอายุแล้ว กรุณาขอรีเซ็ตรหัสผ่านใหม่' },
        { status: 400 },
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password and clear reset token
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Password reset verification error:', error)
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
