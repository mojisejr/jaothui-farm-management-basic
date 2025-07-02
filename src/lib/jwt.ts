import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { COOKIE } from '@/constants/cookies'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET = process.env.JWT_SECRET
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '86400' // 24 hours in seconds
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '2592000' // 30 days in seconds

export interface TokenPayload {
  userId: string
  phoneNumber: string
  email?: string
  type: 'access' | 'refresh'
}

export interface JWTUser {
  id: string
  phoneNumber: string
  email?: string
  firstName?: string
  lastName?: string
}

/**
 * สร้าง Access Token (24 ชั่วโมง)
 */
export function generateAccessToken(user: JWTUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    phoneNumber: user.phoneNumber,
    email: user.email,
    type: 'access',
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseInt(ACCESS_TOKEN_EXPIRY),
    issuer: 'farm-management-system',
    subject: user.id,
  })
}

/**
 * สร้าง Refresh Token (30 วัน)
 */
export function generateRefreshToken(user: JWTUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    phoneNumber: user.phoneNumber,
    email: user.email,
    type: 'refresh',
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseInt(REFRESH_TOKEN_EXPIRY),
    issuer: 'farm-management-system',
    subject: user.id,
  })
}

/**
 * ตรวจสอบและแปลง JWT Token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * ตรวจสอบ Access Token เฉพาะ
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  const decoded = verifyToken(token)
  if (decoded && decoded.type === 'access') {
    return decoded
  }
  return null
}

/**
 * ตรวจสอบ Refresh Token เฉพาะ
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  const decoded = verifyToken(token)
  if (decoded && decoded.type === 'refresh') {
    return decoded
  }
  return null
}

/**
 * สร้าง Token Pair (Access + Refresh)
 */
export function generateTokenPair(user: JWTUser) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    accessTokenExpiry: new Date(
      Date.now() + parseInt(ACCESS_TOKEN_EXPIRY) * 1000,
    ),
    refreshTokenExpiry: new Date(
      Date.now() + parseInt(REFRESH_TOKEN_EXPIRY) * 1000,
    ),
  }
}

/**
 * ตั้งค่า Auth Cookies (สำหรับ Server Side)
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies()

  // Access Token Cookie (httpOnly, secure)
  cookieStore.set(COOKIE.ACCESS, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(ACCESS_TOKEN_EXPIRY),
    path: '/',
  })

  // Refresh Token Cookie (httpOnly, secure)
  cookieStore.set(COOKIE.REFRESH, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(REFRESH_TOKEN_EXPIRY),
    path: '/',
  })
}

/**
 * ลบ Auth Cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()

  cookieStore.delete(COOKIE.ACCESS)
  cookieStore.delete(COOKIE.REFRESH)
}

/**
 * อ่าน Access Token จาก Cookies
 */
export async function getAccessTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE.ACCESS)?.value || null
  } catch (error) {
    console.error('Error reading access token from cookies:', error)
    return null
  }
}

/**
 * อ่าน Refresh Token จาก Cookies
 */
export async function getRefreshTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE.REFRESH)?.value || null
  } catch (error) {
    console.error('Error reading refresh token from cookies:', error)
    return null
  }
}

/**
 * ตรวจสอบว่า token หมดอายุในเร็วๆ นี้ไหม (5 นาทีก่อนหมดอายุ)
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null
    if (!decoded || !decoded.exp) return true

    const expirationTime = decoded.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const fiveMinutesInMs = 5 * 60 * 1000 // 5 minutes

    return expirationTime - currentTime < fiveMinutesInMs
  } catch (_error) {
    return true
  }
}
