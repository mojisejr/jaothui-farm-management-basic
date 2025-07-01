import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

/**
 * Password Complexity Requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
} as const

/**
 * Password Validation Result
 */
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password complexity
 */
export function validatePasswordComplexity(
  password: string,
): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_REQUIREMENTS.minLength} ตัวอักษร`,
    )
  }

  // Check uppercase letter
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
  }

  // Check lowercase letter
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
  }

  // Check numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
  }

  // Check special characters
  if (
    PASSWORD_REQUIREMENTS.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&* ฯลฯ)')
  }

  // Calculate strength
  const hasLength = password.length >= PASSWORD_REQUIREMENTS.minLength
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const criteriaCount = [
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length

  if (criteriaCount >= 5 && password.length >= 12) {
    strength = 'strong'
  } else if (criteriaCount >= 4 && password.length >= 8) {
    strength = 'medium'
  } else {
    strength = 'weak'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Generate a secure random password reset token
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Check if reset token is expired (valid for 1 hour)
 */
export function isResetTokenExpired(tokenExpiry: Date): boolean {
  return new Date() > tokenExpiry
}

/**
 * Generate reset token expiry time (1 hour from now)
 */
export function generateResetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000) // 1 hour
}

/**
 * Sanitize phone number (remove spaces, dashes, parentheses)
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '')
}

/**
 * Validate Thai phone number format
 */
export function validateThaiPhoneNumber(phoneNumber: string): {
  isValid: boolean
  error?: string
} {
  const sanitized = sanitizePhoneNumber(phoneNumber)

  // Thai phone number patterns:
  // - 10 digits starting with 0 (06xxxxxxxx, 08xxxxxxxx, 09xxxxxxxx)
  // - 9 digits starting with 6, 8, or 9 (6xxxxxxxx, 8xxxxxxxx, 9xxxxxxxx)
  const thaiPhoneRegex = /^(?:0?[689]\d{8})$/

  if (!thaiPhoneRegex.test(sanitized)) {
    return {
      isValid: false,
      error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเบอร์มือถือไทย 10 หลัก)',
    }
  }

  return { isValid: true }
}

/**
 * Format phone number for display (add leading zero if needed)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const sanitized = sanitizePhoneNumber(phoneNumber)

  // Add leading zero if 9 digits
  if (sanitized.length === 9 && /^[689]/.test(sanitized)) {
    return '0' + sanitized
  }

  return sanitized
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'รูปแบบอีเมลไม่ถูกต้อง',
    }
  }

  return { isValid: true }
}
