import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { randomBytes } from 'crypto'
import { sendSMS } from '@/lib/sms'

const prisma = new PrismaClient()

interface InviteRequestBody {
  phoneNumber: string
}

// POST /api/farm/[id]/invite - เพิ่มสมาชิกโดยใช้เบอร์โทรศัพท์
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: farmId } = await params

    // Verify authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const { phoneNumber }: InviteRequestBody = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'กรุณากรอกเบอร์โทรศัพท์' },
        { status: 400 },
      )
    }

    // Validate Thai phone number format
    const cleanedPhone = phoneNumber.replace(/\D/g, '')
    const mobilePattern = /^0[689]\d{8}$/
    if (!mobilePattern.test(cleanedPhone)) {
      return NextResponse.json(
        { error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 },
      )
    }

    // Check if farm exists and user is the owner
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: true,
        members: {
          include: {
            profile: {
              select: { phoneNumber: true },
            },
          },
        },
      },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์ม' }, { status: 404 })
    }

    if (farm.ownerId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'เฉพาะเจ้าของฟาร์มเท่านั้นที่สามารถเชิญสมาชิกได้' },
        { status: 403 },
      )
    }

    // Check if the phone number belongs to the owner
    if (farm.owner.phoneNumber === cleanedPhone) {
      return NextResponse.json(
        { error: 'ไม่สามารถเชิญตัวเองได้' },
        { status: 400 },
      )
    }

    // Check if the user is already a member
    const isAlreadyMember = farm.members.some(
      (member) => member.profile.phoneNumber === cleanedPhone,
    )

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์นี้เป็นสมาชิกของฟาร์มแล้ว' },
        { status: 400 },
      )
    }

    // Find the user profile with this phone number
    const inviteeProfile = await prisma.profile.findUnique({
      where: { phoneNumber: cleanedPhone },
    })

    if (!inviteeProfile) {
      return NextResponse.json(
        {
          error:
            'ไม่พบผู้ใช้ที่มีเบอร์โทรศัพท์นี้ กรุณาให้เจ้าของเบอร์สมัครสมาชิกก่อน',
        },
        { status: 404 },
      )
    }

    // Create invitation token (16 bytes hex)
    const token = randomBytes(16).toString('hex')

    // Create invitation record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน

    await prisma.invitation.create({
      data: {
        farmId,
        phoneNumber: cleanedPhone,
        inviterId: tokenPayload.userId,
        token,
        expiresAt,
      },
    })

    // Build invitation link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl}/invite/${token}`

    // Send SMS notification (best effort)
    await sendSMS(
      cleanedPhone,
      `คุณได้รับคำเชิญเข้าร่วมฟาร์ม ${farm.name}. เปิดลิงก์เพื่อเข้าร่วม: ${inviteLink}`,
    )

    return NextResponse.json({
      message: 'สร้างคำเชิญเรียบร้อยแล้ว',
      token,
      expiresAt,
    })
  } catch (error) {
    console.error('Error inviting farm member:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
