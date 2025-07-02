import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { farmCreateSchema } from '@/types/farm'

const prisma = new PrismaClient()

// GET /api/farm/[id] - ดูรายละเอียดฟาร์ม
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // ตรวจสอบ authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'โทเค็นไม่ถูกต้อง' }, { status: 401 })
    }

    // ค้นหาฟาร์ม
    const farm = await prisma.farm.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        animals: {
          select: {
            id: true,
            name: true,
            // @ts-ignore - Prisma types will be updated after migration
            animalType: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์มที่ระบุ' }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์การเข้าถึง (เจ้าของหรือสมาชิก)
    const isOwner = farm.ownerId === tokenPayload.userId
    const isMember = await prisma.farmMember.findFirst({
      where: {
        farmId: farm.id,
        profileId: tokenPayload.userId,
      },
    })

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงฟาร์มนี้' },
        { status: 403 },
      )
    }

    return NextResponse.json({
      farm: {
        ...farm,
        isOwner,
        isMember: !!isMember,
      },
    })
  } catch (error) {
    console.error('Error fetching farm:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลฟาร์ม' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/farm/[id] - แก้ไขฟาร์ม
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // ตรวจสอบ authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'โทเค็นไม่ถูกต้อง' }, { status: 401 })
    }

    // ค้นหาฟาร์มและตรวจสอบความเป็นเจ้าของ
    const farm = await prisma.farm.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์มที่ระบุ' }, { status: 404 })
    }

    if (farm.ownerId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขฟาร์มนี้' },
        { status: 403 },
      )
    }

    // รับข้อมูลจาก request body
    const body = await request.json()
    const { name, province, size, description } = body

    // Validate ข้อมูลด้วย Zod
    const validationResult = farmCreateSchema.safeParse({
      name,
      province,
      size,
      description,
    })

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const validatedData = validationResult.data

    // อัปเดทฟาร์ม
    const updatedFarm = await prisma.farm.update({
      where: { id },
      data: {
        name: validatedData.name,
        province: validatedData.province,
        size: validatedData.size,
        description: validatedData.description,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'อัปเดทฟาร์มสำเร็จ',
      farm: updatedFarm,
    })
  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดทฟาร์ม' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/farm/[id] - ลบฟาร์ม
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // ตรวจสอบ authentication
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'โทเค็นไม่ถูกต้อง' }, { status: 401 })
    }

    // ค้นหาฟาร์มและตรวจสอบความเป็นเจ้าของ
    const farm = await prisma.farm.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        name: true,
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่พบฟาร์มที่ระบุ' }, { status: 404 })
    }

    if (farm.ownerId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบฟาร์มนี้' },
        { status: 403 },
      )
    }

    // ตรวจสอบข้อมูลที่เกี่ยวข้อง
    if (farm._count.animals > 0) {
      return NextResponse.json(
        {
          error: `ไม่สามารถลบฟาร์มได้เนื่องจากมีสัตว์ ${farm._count.animals} ตัว กรุณาลบสัตว์ทั้งหมดก่อน`,
        },
        { status: 400 },
      )
    }

    if (farm._count.members > 0) {
      return NextResponse.json(
        {
          error: `ไม่สามารถลบฟาร์มได้เนื่องจากมีสมาชิก ${farm._count.members} คน กรุณาลบสมาชิกทั้งหมดก่อน`,
        },
        { status: 400 },
      )
    }

    // ลบฟาร์ม
    await prisma.farm.delete({
      where: { id },
    })

    return NextResponse.json({
      message: `ลบฟาร์ม "${farm.name}" สำเร็จ`,
    })
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบฟาร์ม' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
