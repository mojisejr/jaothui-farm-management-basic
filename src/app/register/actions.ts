'use server'

import { redirect } from 'next/navigation'
import { AuthResponse, registerSchema, User } from '@/types/auth'
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

const prisma = new PrismaClient()

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
      const errorMessage = Object.values(errors).flat().join(', ')
      return {
        success: false,
        message: errorMessage,
      }
    }

    const { phone, password, firstName, lastName, email } = validatedFields.data

    // Validate phone number format
    const phoneValidation = validateThaiPhoneNumber(phone)
    if (!phoneValidation.isValid) {
      return {
        success: false,
        message: phoneValidation.error || 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
      }
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
      }
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        return {
          success: false,
          message: emailValidation.error || 'รูปแบบอีเมลไม่ถูกต้อง',
        }
      }
    }

    // Format phone number
    const formattedPhoneNumber = formatPhoneNumber(phone)

    // Check if phone number already exists
    const existingUserByPhone = await prisma.profile.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
    })

    if (existingUserByPhone) {
      return {
        success: false,
        message: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว',
      }
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingUserByEmail = await prisma.profile.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUserByEmail) {
        return {
          success: false,
          message: 'อีเมลนี้ถูกใช้แล้ว',
        }
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

    // Success response
    const userResponse: User = {
      id: newUser.id,
      phoneNumber: newUser.phoneNumber,
      email: newUser.email || null,
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      phoneVerified: newUser.phoneVerified,
      emailVerified: newUser.emailVerified,
      verified: newUser.verified,
      createdAt: newUser.createdAt,
      updatedAt: newUser.createdAt, // Add updatedAt field
    }

    return {
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      redirectUrl: '/profile',
      user: userResponse,
    }
  } catch (error) {
    console.error('Register action error:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('phoneNumber')) {
        return {
          success: false,
          message: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว',
        }
      }
      if (error.message.includes('email')) {
        return {
          success: false,
          message: 'อีเมลนี้ถูกใช้แล้ว',
        }
      }
    }
    
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้ง',
    }
  } finally {
    await prisma.$disconnect()
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
