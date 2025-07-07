import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: payload.userId },
      select: { phoneNumber: true },
    })

    if (!profile?.phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 400 })
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        phoneNumber: {
          equals: profile.phoneNumber,
        },
        status: 'PENDING',
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        farm: {
          select: { id: true, name: true },
        },
        inviter: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
