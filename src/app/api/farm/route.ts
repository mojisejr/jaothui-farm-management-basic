import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '@/lib/farm-auth'

const prisma = new PrismaClient()

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

    // ค้นหาฟาร์มที่เป็นเจ้าของ
    const ownedFarms = await prisma.farm.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ค้นหาฟาร์มที่เป็นสมาชิก
    const memberFarms = await prisma.farmMember.findMany({
      where: { profileId: userId },
      include: {
        farm: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            _count: {
              select: {
                animals: true,
                members: true,
              },
            },
          },
        },
      },
    })

    // รวมข้อมูลฟาร์มทั้งหมด
    const allFarms = [
      ...ownedFarms.map((farm) => ({
        ...farm,
        role: 'owner' as const,
        isOwner: true,
        isMember: false,
      })),
      ...memberFarms.map((membership) => ({
        ...membership.farm,
        role: 'member' as const,
        isOwner: false,
        isMember: true,
      })),
    ]

    // สถิติฟาร์ม
    const stats = {
      totalFarms: allFarms.length,
      ownedFarms: ownedFarms.length,
      memberFarms: memberFarms.length,
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
  } finally {
    await prisma.$disconnect()
  }
}
