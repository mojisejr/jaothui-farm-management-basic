'use server'

import { AuthResponse, forgotPasswordSchema } from '@/types/auth'
import { PrismaClient } from '@prisma/client'
import {
  validateEmail,
  generateResetToken,
  generateResetTokenExpiry,
} from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function forgotPassword(
  prevState: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  try {
    // Validate form data
    const validatedFields = forgotPasswordSchema.safeParse({
      email: formData.get('email'),
    })

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors
      const errorMessage = Object.values(errors).flat().join(', ')
      return {
        success: false,
        message: errorMessage,
      }
    }

    const { email } = validatedFields.data

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        message: emailValidation.error || 'รูปแบบอีเมลไม่ถูกต้อง',
      }
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
      return {
        success: true,
        message: successMessage,
      }
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
    return {
      success: true,
      message: successMessage,
    }
  } catch (error) {
    console.error('Forgot password action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  } finally {
    await prisma.$disconnect()
  }
}
