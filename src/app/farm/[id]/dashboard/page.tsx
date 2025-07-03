import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { COOKIE } from '@/constants/cookies'
import DashboardLayout from '@/components/DashboardLayout'

interface FarmDetail {
  id: string
  name: string
  province: string
  size: number | null
  description: string | null
  isOwner: boolean
  isMember: boolean
  owner: {
    id: string
    firstName: string | null
    lastName: string | null
    phoneNumber: string
  }
  _count: {
    animals: number
    members: number
  }
}

async function getFarmDetail(farmId: string): Promise<FarmDetail> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE.ACCESS)?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/farm/${farmId}`, {
      headers: {
        Cookie: `${COOKIE.ACCESS}=${token}`,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    })

    if (response.status === 401) {
      redirect('/login')
    }

    if (response.status === 404) {
      notFound()
    }

    if (response.status === 403) {
      redirect('/farms?error=ไม่มีสิทธิ์เข้าถึงฟาร์มนี้')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch farm details')
    }

    const data = await response.json()
    return data.farm as FarmDetail
  } catch (error) {
    console.error('Error fetching farm details:', error)
    throw error
  }
}

export default async function FarmDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const farm = await getFarmDetail(id)

    return (
      <div className="min-h-screen bg-[#414141]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 text-white">
          <h1 className="text-xl font-semibold text-white">{farm.name}</h1>
          <Image
            src="/images/jaothui-logo.png"
            alt="JAOTHUI Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg mx-4 p-6 min-h-[80vh]">
          <DashboardLayout farmId={farm.id} farmName={farm.name} farm={farm} />
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-6">
          <a
            href="/farms"
            className="btn btn-outline btn-block text-white border-white hover:bg-white hover:text-neutral"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading farm dashboard:', error)
    return (
      <div className="min-h-screen bg-[#414141] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg mx-4 p-6">
          <div className="alert alert-error">
            <span>เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม กรุณาลองใหม่อีกครั้ง</span>
          </div>
        </div>
      </div>
    )
  }
}
