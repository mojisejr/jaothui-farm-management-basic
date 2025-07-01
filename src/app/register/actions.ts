'use server'

import { redirect } from 'next/navigation'
import { AuthResponse, registerSchema } from '@/types/auth'

export async function signup(
  prevState: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  try {
    // Validate form data
    const validatedFields = registerSchema.safeParse({
      phone: formData.get('phone'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
    })

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors
      console.log(errors)
      const errorMessage = Object.values(errors).flat().join(', ')
      return {
        success: false,
        message: errorMessage,
      }
    }

    const { phone, password, firstName, lastName, email } = validatedFields.data

    // Call register API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone,
          password,
          firstName,
          lastName,
          email: email || undefined,
        }),
        credentials: 'include',
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'สมัครสมาชิกไม่สำเร็จ',
      }
    }

    // Success response
    return {
      success: true,
      message: data.message || 'สมัครสมาชิกสำเร็จ',
      redirectUrl: '/profile',
      user: data.user,
    }
  } catch (error) {
    console.error('Register action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  }
}

// Server action for redirecting after successful registration
export async function handleRegistrationSuccess(redirectUrl?: string) {
  if (redirectUrl && redirectUrl !== '/register') {
    redirect(redirectUrl)
  } else {
    redirect('/profile')
  }
}

// Legacy function for backward compatibility
export async function signupLegacy(formData: FormData) {
  const result = await signup(null, formData)

  if (result.success && result.redirectUrl) {
    redirect(result.redirectUrl)
  } else {
    redirect(
      `/register?error=${encodeURIComponent(result.message || 'Registration failed')}`,
    )
  }
}
