import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withFarmAuth } from '@/lib/with-farm-auth'

// GET /api/farm/[id]/activities - ดึงรายการกิจกรรมของฟาร์ม
const _GET = async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id: farmId } = await context.params
    const { searchParams } = new URL(request.url)

    // รับ parameters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)
    const offset = (page - 1) * limit

    // สร้าง where condition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      animal: { farmId: farmId },
    }

    // Filter by status
    if (
      status &&
      ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)
    ) {
      whereCondition.status = status
    }

    // Search by title, description, notes, or animal name
    if (search.trim()) {
      whereCondition.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { notes: { contains: search.trim(), mode: 'insensitive' } },
        { animal: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ]
    }

    // ดึงข้อมูลกิจกรรม
    const activities = await prisma.activity.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        activityDate: true,
        status: true,
        createdAt: true,
        animal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        activityDate: 'desc',
      },
      skip: offset,
      take: limit,
    })

    // นับจำนวนทั้งหมด
    const totalCount = await prisma.activity.count({
      where: whereCondition,
    })

    // ดึงรายการสถานะกิจกรรม
    const statuses = [
      { value: 'PENDING', label: 'รอดำเนินการ' },
      { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
      { value: 'COMPLETED', label: 'เสร็จสิ้น' },
      { value: 'CANCELLED', label: 'ยกเลิก' },
    ]

    // Activities มี animalType อยู่แล้วจาก include
    const activitiesWithType = activities

    // คำนวณ pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrevious = page > 1

    return NextResponse.json({
      activities: activitiesWithType,
      statuses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrevious,
      },
    })
  } catch (error) {
    console.error('Error fetching farm activities:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม' },
      { status: 500 },
    )
  }
}

export const GET = withFarmAuth(_GET)
