import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { COOKIE } from '@/constants/cookies'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE.ACCESS)?.value

    if (!token) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const { farmId } = await request.json()

    if (!farmId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลฟาร์ม' }, { status: 400 })
    }

    // Verify user has access to this farm
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        OR: [
          { ownerId: decoded.userId },
          { members: { some: { profileId: decoded.userId } } }
        ]
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงฟาร์มนี้' }, { status: 403 })
    }

    // Generate unique microchip
    let microchip = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
      const random = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 random chars
      microchip = `TH${farmId.slice(-4)}${timestamp}${random}`

      // Check if microchip already exists
      const existingAnimal = await prisma.animal.findFirst({
        where: { microchip }
      })

      if (!existingAnimal) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json({ 
        error: 'ไม่สามารถสร้างไมโครชิปที่ไม่ซ้ำได้ กรุณาลองใหม่' 
      }, { status: 500 })
    }

    return NextResponse.json({ microchip })

  } catch (error) {
    console.error('Generate microchip error:', error)
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการสร้างไมโครชิป' 
    }, { status: 500 })
  }
}