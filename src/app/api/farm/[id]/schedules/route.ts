import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withFarmAuth } from '@/lib/with-farm-auth'

// GET /api/farm/[id]/schedules - ดึงรายการกำหนดการของฟาร์ม
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // จำกัดไม่เกิน 50

    // สร้าง where conditions
    const whereConditions: Record<string, unknown> = {
      animal: {
        farmId: farmId,
      },
    }

    // เพิ่ม search condition
    if (search.trim()) {
      whereConditions.OR = [
        {
          title: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          animal: {
            name: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    // เพิ่ม status filter
    if (status) {
      whereConditions.status = status
    }

    // นับจำนวนทั้งหมด
    const totalCount = await prisma.activitySchedule.count({
      where: whereConditions,
    })

    const totalPages = Math.ceil(totalCount / limit)
    const offset = (page - 1) * limit

    // ดึงข้อมูลกำหนดการ
    const schedules = await prisma.activitySchedule.findMany({
      where: whereConditions,
      include: {
        animal: {
          include: {
            animalType: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' }, // กำหนดการที่ใกล้ที่สุดก่อน
        { createdAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    })

    // ดึงรายการ status ที่มีอยู่
    const statusCounts = await prisma.activitySchedule.groupBy({
      by: ['status'],
      where: {
        animal: {
          farmId: farmId,
        },
      },
      _count: {
        status: true,
      },
    })

    const statuses = [
      { value: '', label: 'ทั้งหมด' },
      { value: 'PENDING', label: 'รอดำเนินการ' },
      { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
      { value: 'COMPLETED', label: 'เสร็จสิ้น' },
      { value: 'CANCELLED', label: 'ยกเลิก' },
    ].filter((statusOption) => {
      if (statusOption.value === '') return true // แสดง "ทั้งหมด" เสมอ
      return statusCounts.some((sc) => sc.status === statusOption.value)
    })

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    }

    return NextResponse.json({
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        notes: schedule.notes,
        scheduledDate: schedule.scheduledDate,
        status: schedule.status,
        isRecurring: schedule.isRecurring,
        recurrenceType: schedule.recurrenceType,
        createdAt: schedule.createdAt,
        animal: {
          id: schedule.animal.id,
          name: schedule.animal.name,
          animalType: schedule.animal.animalType,
        },
      })),
      statuses,
      pagination,
    })
  } catch (error) {
    console.error('Farm schedules fetch error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลกำหนดการได้' },
      { status: 500 }
    )
  }
}

export const GET = withFarmAuth(_GET)