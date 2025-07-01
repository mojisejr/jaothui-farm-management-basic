import { z } from 'zod'

// JWT User type for our authentication system
export interface JWTUser {
  id: string
  phone: string
  email?: string | null
  user_metadata: {
    firstName: string
    lastName: string
  }
  created_at?: string
  updated_at?: string
}

// Phone number validation for Thai phone numbers
export const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(0[0-9]{8,9}|\+66[0-9]{8,9})$/,
    'Please enter a valid Thai phone number (e.g., 0812345678 or +66812345678)',
  )

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  )

// Email validation (optional)
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .optional()
  .or(z.literal(''))

// Login form schema
export const loginSchema = z.object({
  phone: phoneNumberSchema,
  password: z.string().min(1, 'Password is required'),
})

// Registration form schema
export const registerSchema = z
  .object({
    phone: phoneNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name is too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name is too long'),
    email: emailSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Reset password schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// User type for our JWT system
export interface User {
  id: string
  phoneNumber: string
  email?: string | null
  firstName: string
  lastName: string
  phoneVerified: boolean
  emailVerified: boolean
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

// JWT token payload
export interface JWTPayload {
  userId: string
  phoneNumber: string
  iat: number
  exp: number
}

// Auth error types
export interface AuthError {
  message: string
  status?: number
  details?: string[]
}

// Auth success response
export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  redirectUrl?: string
}

// Token information
export interface TokenInfo {
  accessTokenExpiry: Date
  refreshTokenExpiry: Date
}

// Auth Context Type
export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (phone: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}
