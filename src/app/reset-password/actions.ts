'use server'

import { AuthResponse, resetPasswordSchema } from '@/types/auth'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import {
  hashPassword,
  validatePasswordComplexity,
  isResetTokenExpired,
} from '@/lib/password'

const prisma = new PrismaClient()

export async function resetPassword(
  prevState: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  try {
    // Validate form data
    const validatedFields = resetPasswordSchema.safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors
      const errorMessage = Object.values(errors).flat().join(', ')
      return {
        success: false,
        message: errorMessage,
      }
    }

    const { token, password } = validatedFields.data

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
      }
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
      return {
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ',
      }
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

      return {
        success: false,
        message: 'Token หมดอายุแล้ว กรุณาขอรีเซ็ตรหัสผ่านใหม่',
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password and clear reset token
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Success response
    return {
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
      redirectUrl: '/login',
    }
  } catch (error) {
    console.error('Reset password action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Simple reset password action for direct formAction usage
export async function resetPasswordSimple(formData: FormData) {
  const result = await resetPassword(null, formData)

  if (result.success && result.redirectUrl) {
    redirect(
      result.redirectUrl + '?message=' + encodeURIComponent(result.message),
    )
  } else {
    redirect('/reset-password?error=' + encodeURIComponent(result.message))
  }
}

// Server action for redirecting after successful password reset
export async function handlePasswordResetSuccess() {
  redirect(
    '/login?message=รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
  )
}
