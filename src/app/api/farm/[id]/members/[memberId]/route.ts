import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { withFarmAuth } from '@/lib/with-farm-auth'

const prisma = new PrismaClient()

const _DELETE = async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id: farmId, memberId } = await context.params

    // Verify authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if farm exists and user is the owner
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        ownerId: true,
      },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์ม' }, { status: 404 })
    }

    if (farm.ownerId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'เฉพาะเจ้าของฟาร์มเท่านั้นที่สามารถลบสมาชิกได้' },
        { status: 403 },
      )
    }

    // Prevent removing the owner
    if (memberId === farm.ownerId) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบเจ้าของฟาร์มได้' },
        { status: 400 },
      )
    }

    // Check if the member exists in the farm
    const farmMember = await prisma.farmMember.findUnique({
      where: {
        profileId_farmId: {
          profileId: memberId,
          farmId: farmId,
        },
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    })

    if (!farmMember) {
      return NextResponse.json(
        { error: 'ไม่พบสมาชิกในฟาร์มนี้' },
        { status: 404 },
      )
    }

    // Remove the member from the farm
    await prisma.farmMember.delete({
      where: {
        profileId_farmId: {
          profileId: memberId,
          farmId: farmId,
        },
      },
    })

    const memberName =
      farmMember.profile.firstName && farmMember.profile.lastName
        ? `${farmMember.profile.firstName} ${farmMember.profile.lastName}`
        : farmMember.profile.phoneNumber

    return NextResponse.json({
      message: 'ลบสมาชิกเรียบร้อยแล้ว',
      removedMember: memberName,
    })
  } catch (error) {
    console.error('Error removing farm member:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export const DELETE = withFarmAuth(_DELETE, { ownerOnly: true })
