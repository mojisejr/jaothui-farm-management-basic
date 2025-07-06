import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications/service'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'ไม่พบคำเชิญ' }, { status: 404 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'คำเชิญนี้ไม่สามารถใช้งานได้' },
        { status: 400 },
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'คำเชิญหมดอายุแล้ว' }, { status: 400 })
    }

    // Verify user authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if phone number matches authenticated user
    const profile = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
      select: { phoneNumber: true },
    })

    if (!profile || profile.phoneNumber !== invitation.phoneNumber) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์ไม่ตรงกับคำเชิญ' },
        { status: 400 },
      )
    }

    // Add user to farm members
    await prisma.farmMember.create({
      data: {
        farmId: invitation.farmId,
        profileId: tokenPayload.userId,
        role: 'MEMBER',
      },
    })

    // Update invitation status
    await prisma.invitation.update({
      where: { token },
      data: { status: 'ACCEPTED' },
    })

    // Create member joined notification
    try {
      const newMember = await prisma.profile.findUnique({
        where: { id: tokenPayload.userId },
        select: { firstName: true, lastName: true, phoneNumber: true },
      })

      const memberName = newMember 
        ? `${newMember.firstName || ''} ${newMember.lastName || ''}`.trim() || newMember.phoneNumber
        : 'สมาชิกใหม่'

      await NotificationService.createMemberJoinedNotification(
        invitation.farmId,
        memberName,
        tokenPayload.userId
      )
    } catch (notificationError) {
      console.error('Failed to create member joined notification:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ message: 'เข้าร่วมฟาร์มเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
