'use server'

import { AuthResponse, loginSchema, User } from '@/types/auth'
import { redirect } from 'next/navigation'
import {
  verifyPassword,
  validateThaiPhoneNumber,
  formatPhoneNumber,
} from '@/lib/password'
import { generateTokenPair, setAuthCookies } from '@/lib/jwt'
import prisma from '@/lib/prisma'

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

    // Validate phone number format
    const phoneValidation = validateThaiPhoneNumber(phone)
    if (!phoneValidation.isValid) {
      return {
        success: false,
        message: phoneValidation.error || 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
      }
    }

    // Format phone number
    const formattedPhoneNumber = formatPhoneNumber(phone)

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
        updatedAt: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง',
      }
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง',
      }
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
    const { passwordHash: _passwordHash, ...rawUser } = user
    
    const userResponse: User = {
      ...rawUser,
      firstName: rawUser.firstName || '',
      lastName: rawUser.lastName || '',
      email: rawUser.email || null,
    }

    return {
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      redirectUrl: '/profile',
      user: userResponse,
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  } finally {
    await prisma.$disconnect()
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
