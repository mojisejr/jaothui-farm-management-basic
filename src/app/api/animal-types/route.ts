import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const animalTypes = await prisma.animalType.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(animalTypes)
  } catch (error) {
    console.error('Error fetching animal types:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลประเภทสัตว์ได้' },
      { status: 500 },
    )
  }
}
