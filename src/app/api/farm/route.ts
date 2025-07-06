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

    // ค้นหาฟาร์มที่ผู้ใช้เป็นเจ้าของเท่านั้น
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

    const stats = {
      totalFarms: ownedFarms.length,
      totalAnimals: ownedFarms.reduce(
        (sum, farm) => sum + farm._count.animals,
        0,
      ),
    }

    return NextResponse.json({
      farms: ownedFarms.map((farm) => ({
        ...farm,
        isOwner: true,
        isMember: false,
      })),
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
