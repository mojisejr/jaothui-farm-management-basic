import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { COOKIE } from '@/constants/cookies'
import FarmLayout from '@/components/layouts/FarmLayout'
import FarmEditForm from '@/components/FarmEditForm'

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
}

async function getFarmForEdit(farmId: string): Promise<FarmDetail> {
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
    const farm = data.farm as FarmDetail

    // ตรวจสอบว่าเป็นเจ้าของหรือไม่
    if (!farm.isOwner) {
      redirect(
        `/farm/${farmId}/dashboard?error=เฉพาะเจ้าของฟาร์มเท่านั้นที่สามารถแก้ไขได้`,
      )
    }

    return farm
  } catch (error) {
    console.error('Error fetching farm details:', error)
    throw error
  }
}

export default async function EditFarmPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const farm = await getFarmForEdit(id)

    return (
      <FarmLayout
        title="แก้ไขฟาร์ม"
        subtitle={`ปรับปรุงข้อมูลฟาร์ม "${farm.name}"`}
        farmId={farm.id}
        farmName={farm.name}
        variant="form"
        maxWidth="md"
        backUrl={`/farm/${farm.id}/dashboard`}
      >
        <FarmEditForm farm={farm} />
      </FarmLayout>
    )
  } catch (error) {
    console.error('Error loading farm edit page:', error)

    return (
      <FarmLayout
        title="เกิดข้อผิดพลาด"
        subtitle="ไม่สามารถโหลดข้อมูลฟาร์มได้"
        backUrl="/farms"
        error={error as Error}
        onRetry={() => window.location.reload()}
      >
        <div className="text-center">
          <div className="alert alert-error mb-4">
            <span>เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม กรุณาลองใหม่อีกครั้ง</span>
          </div>
          <a href="/farms" className="btn btn-primary">
            กลับไปหน้ารายการฟาร์ม
          </a>
        </div>
      </FarmLayout>
    )
  }
}
