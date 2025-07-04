import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const invitation = await prisma.invitation.findUnique({ where: { token } })
    if (!invitation) {
      return NextResponse.json({ error: 'ไม่พบคำเชิญ' }, { status: 404 })
    }
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'คำเชิญนี้ไม่สามารถใช้งานได้' },
        { status: 400 },
      )
    }

    // Verify auth
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // phone match
    const profile = await prisma.profile.findUnique({
      where: { id: payload.userId },
      select: { phoneNumber: true },
    })
    if (!profile || profile.phoneNumber !== invitation.phoneNumber) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์ไม่ตรงกับคำเชิญ' },
        { status: 400 },
      )
    }

    await prisma.invitation.update({
      where: { token },
      data: { status: 'DECLINED' },
    })

    return NextResponse.json({ message: 'ปฏิเสธคำเชิญเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error declining invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
