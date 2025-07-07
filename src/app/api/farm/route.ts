import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/farm-auth'

// GET /api/farm - รายการฟาร์มของผู้ใช้
export async function GET(_request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const authResult = await authenticateUser()
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    const userId = authResult.userId!

    // ค้นหาฟาร์มที่ผู้ใช้เป็นเจ้าของ
    const ownedFarms = await prisma.farm.findMany({
      where: { ownerId: userId },
      include: {
        owner: true,
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ค้นหาฟาร์มที่ผู้ใช้เป็นสมาชิก
    const memberFarms = await prisma.farm.findMany({
      where: {
        members: {
          some: { profileId: userId },
        },
        ownerId: { not: userId }, // หลีกเลี่ยงการดึงซ้ำ
      },
      include: {
        owner: true,
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // รวมฟาร์มทั้งหมด
    const allFarms = [
      ...ownedFarms.map((farm) => ({
        ...farm,
        isOwner: true,
        isMember: false,
      })),
      ...memberFarms.map((farm) => ({
        ...farm,
        isOwner: false,
        isMember: true,
      })),
    ]

    const stats = {
      totalFarms: allFarms.length,
      totalAnimals: allFarms.reduce(
        (sum, farm) => sum + farm._count.animals,
        0,
      ),
    }

    return NextResponse.json({
      farms: allFarms,
      stats,
    })
  } catch (error) {
    console.error('Error fetching user farms:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลฟาร์ม' },
      { status: 500 },
    )
  }
}
