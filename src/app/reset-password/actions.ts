'use server'

import { AuthResponse, resetPasswordSchema } from '@/types/auth'
import { redirect } from 'next/navigation'

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

    // Call reset password API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้',
      }
    }

    // Success response
    return {
      success: true,
      message: data.message || 'รีเซ็ตรหัสผ่านสำเร็จ',
      redirectUrl: '/login',
    }
  } catch (error) {
    console.error('Reset password action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
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
