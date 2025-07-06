import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withFarmAuth } from '@/lib/with-farm-auth'

// GET /api/farm/[id]/animals - ดึงรายการสัตว์ของฟาร์ม
const _GET = async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id: farmId } = await context.params
    const { searchParams } = new URL(request.url)

    // ดึงพารามิเตอร์สำหรับ search และ filter
    const search = searchParams.get('search') || ''
    const animalTypeId = searchParams.get('animalTypeId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // สร้าง where condition
    const whereCondition: {
      farmId: string
      OR?: Array<{ [key: string]: { contains: string; mode: string } }>
      animalTypeId?: string
    } = {
      farmId: farmId,
    }

    // เพิ่ม search condition
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { microchip: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ]
    }

    // เพิ่ม animal type filter
    if (animalTypeId) {
      whereCondition.animalTypeId = animalTypeId
    }

    // ดึงข้อมูลสัตว์แบบธรรมดา
    const animals = await prisma.animal.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

    // นับจำนวนทั้งหมด
    const totalCount = await prisma.animal.count({
      where: whereCondition,
    })

    // ดึงรายการ animal types สำหรับ filter
    const animalTypes = await prisma.animalType.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    // สร้าง type lookup map
    const typeMap: Record<string, { id: string; name: string }> = {}
    animalTypes.forEach((type: { id: string; name: string }) => {
      typeMap[type.id] = { id: type.id, name: type.name }
    })

    // แปลง animals โดยเพิ่ม animalType
    const animalsWithType = animals.map((animal) => ({
      id: animal.id,
      name: animal.name,
      microchip: animal.microchip,
      birthDate: animal.birthDate,
      weight: animal.weight,
      height: animal.height,
      color: animal.color,
      image: animal.image,
      createdAt: animal.createdAt,
      animalType: typeMap[animal.animalTypeId] || null,
    }))

    return NextResponse.json({
      animals: animalsWithType,
      animalTypes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrevious: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching animals:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสัตว์' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export const GET = withFarmAuth(_GET)
