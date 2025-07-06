import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withFarmAuth } from '@/lib/with-farm-auth'

const prisma = new PrismaClient()

const _DELETE = async (
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id: farmId } = await context.params

    // withFarmAuth ensures user authenticated and has access (owner/member)
    // Retrieve user id from token via helper (already checked); we need userId
    // We'll parse from cookies util quickly
    const { authenticateUser } = await import('@/lib/farm-auth')
    const authRes = await authenticateUser()
    if (!authRes.success) {
      return NextResponse.json(
        { error: authRes.error },
        { status: authRes.status ?? 401 },
      )
    }
    const userId = authRes.userId!

    // Check if owner
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { ownerId: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์ม' }, { status: 404 })
    }
    if (farm.ownerId === userId) {
      return NextResponse.json(
        { error: 'เจ้าของฟาร์มไม่สามารถออกจากฟาร์มได้' },
        { status: 400 },
      )
    }

    // Delete membership
    await prisma.farmMember.delete({
      where: {
        profileId_farmId: {
          profileId: userId,
          farmId,
        },
      },
    })

    return NextResponse.json({ message: 'ออกจากฟาร์มเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error leaving farm:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export const DELETE = withFarmAuth(_DELETE)
