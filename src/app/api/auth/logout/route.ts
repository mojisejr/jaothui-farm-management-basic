import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/jwt'

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'ออกจากระบบสำเร็จ',
      },
      { status: 200 },
    )

    // Clear auth cookies
    await clearAuthCookies()

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 },
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
