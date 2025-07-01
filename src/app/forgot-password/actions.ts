'use server'

import { AuthResponse, forgotPasswordSchema } from '@/types/auth'

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

    // Call forgot password API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้',
      }
    }

    // Success response
    return {
      success: true,
      message: data.message || 'ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
    }
  } catch (error) {
    console.error('Forgot password action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  }
}
