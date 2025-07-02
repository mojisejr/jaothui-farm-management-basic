import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '@/lib/farm-auth'

const prisma = new PrismaClient()

// POST /api/farm/[id]/invite - เพิ่มสมาชิกโดยใช้เบอร์โทรศัพท์
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: farmId } = await params

    // ตรวจสอบ authentication
    const authResult = await authenticateUser()
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    const userId = authResult.userId!

    // ตรวจสอบว่าเป็นเจ้าของฟาร์ม
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { ownerId: true },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์ม' }, { status: 404 })
    }

    if (farm.ownerId !== userId) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    }

    // รับเบอร์โทรจาก body
    const body = await request.json()
    const phoneNumber = (body.phoneNumber as string | undefined)?.trim()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 },
      )
    }

    // ค้นหาโปรไฟล์โดยเบอร์โทร
    const profile = await prisma.profile.findUnique({
      where: { phoneNumber },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'ไม่พบบัญชีผู้ใช้ด้วยเบอร์นี้' },
        { status: 404 },
      )
    }

    // ตรวจสอบว่ามีอยู่แล้ว
    const exists = await prisma.farmMember.findUnique({
      where: {
        profileId_farmId: {
          profileId: profile.id,
          farmId,
        },
      },
    })

    if (exists) {
      return NextResponse.json(
        { error: 'ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว' },
        { status: 400 },
      )
    }

    await prisma.farmMember.create({
      data: {
        profileId: profile.id,
        farmId,
      },
    })

    return NextResponse.json({ message: 'เพิ่มสมาชิกสำเร็จ' })
  } catch (error) {
    console.error('Error inviting member:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
