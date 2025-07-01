'use server'

import { AuthResponse, loginSchema } from '@/types/auth'
import { redirect } from 'next/navigation'

export async function login(
  prevState: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  try {
    // Validate form data
    const validatedFields = loginSchema.safeParse({
      phone: formData.get('phone'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors
      const errorMessage = Object.values(errors).flat().join(', ')
      return {
        success: false,
        message: errorMessage,
      }
    }

    const { phone, password } = validatedFields.data

    // Call login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phone,
        password,
      }),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'เข้าสู่ระบบไม่สำเร็จ',
      }
    }

    // Success response
    return {
      success: true,
      message: data.message || 'เข้าสู่ระบบสำเร็จ',
      redirectUrl: '/profile',
      user: data.user,
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  }
}

// Server action for redirecting after successful login
export async function handleLoginSuccess(redirectUrl?: string) {
  if (redirectUrl && redirectUrl !== '/login') {
    redirect(redirectUrl)
  } else {
    redirect('/profile')
  }
}

// Legacy function for backward compatibility
export async function loginLegacy(formData: FormData) {
  const result = await login(null, formData)

  if (result.success && result.redirectUrl) {
    redirect(result.redirectUrl)
  } else {
    redirect(
      `/login?error=${encodeURIComponent(result.message || 'Login failed')}`,
    )
  }
}
