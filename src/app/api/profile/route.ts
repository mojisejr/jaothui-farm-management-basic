import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const profileQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z
    .enum(['firstName', 'lastName', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phoneNumber: z.string().optional(),
})

/**
 * GET /api/profile - Get current user profile or search profiles
 */
export async function GET(request: NextRequest) {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'ไม่พบ access token' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Access token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)

    // If no search params, return current user profile
    if (searchParams.size === 0) {
      const profile = await prisma.profile.findUnique({
        where: { id: tokenPayload.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          phoneVerified: true,
          verified: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!profile) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลโปรไฟล์' },
          { status: 404 },
        )
      }

      return NextResponse.json({ profile })
    }

    // Parse query parameters for search
    const queryParams = profileQuerySchema.safeParse({
      search: searchParams.get('search'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      orderBy: searchParams.get('orderBy'),
      order: searchParams.get('order'),
    })

    if (!queryParams.success) {
      return NextResponse.json(
        {
          error: 'พารามิเตอร์ query ไม่ถูกต้อง',
          details: queryParams.error.errors,
        },
        { status: 400 },
      )
    }

    const { search, limit, offset, orderBy, order } = queryParams.data

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              lastName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}

    // Get profiles (excluding current user and sensitive data)
    const profiles = await prisma.profile.findMany({
      where: {
        ...whereClause,
        NOT: { id: tokenPayload.userId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profileImage: true,
        verified: true,
        createdAt: true,
      },
      orderBy: { [orderBy]: order },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.profile.count({
      where: {
        ...whereClause,
        NOT: { id: tokenPayload.userId },
      },
    })

    return NextResponse.json({
      profiles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PUT /api/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'ไม่พบ access token' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Access token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const validatedData = profileUpdateSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'ข้อมูลไม่ถูกต้อง',
          details: validatedData.error.errors,
        },
        { status: 400 },
      )
    }

    const { firstName, lastName, phoneNumber } = validatedData.data

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { id: tokenPayload.userId },
      data: {
        firstName,
        lastName,
        ...(phoneNumber && { phoneNumber }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        phoneVerified: true,
        verified: true,
        profileImage: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('PUT /api/profile error:', error)

    // Handle case where profile doesn't exist
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'ไม่พบโปรไฟล์' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * DELETE /api/profile - Delete current user profile
 */
export async function DELETE() {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'ไม่พบ access token' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Access token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 },
      )
    }

    // Delete profile (this will also trigger cascade delete for related data)
    await prisma.profile.delete({
      where: { id: tokenPayload.userId },
    })

    return NextResponse.json({
      success: true,
      message: 'ลบโปรไฟล์เรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('DELETE /api/profile error:', error)

    // Handle case where profile doesn't exist
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'ไม่พบโปรไฟล์' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
