import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FarmEditForm from '@/components/FarmEditForm'

interface FarmDetail {
  id: string
  name: string
  province: string
  size: number | null
  cropTypes: string[]
  description: string | null
  createdAt: string
  updatedAt: string
  isOwner: boolean
  isMember: boolean
  owner: {
    id: string
    name: string
    email: string
  }
}

async function getFarmForEdit(farmId: string): Promise<FarmDetail> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/auth/login')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/farm/${farmId}`, {
      headers: {
        Cookie: `token=${token}`,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    })

    if (response.status === 401) {
      redirect('/auth/login')
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

    const farm = await response.json()

    // ตรวจสอบว่าเป็นเจ้าของหรือไม่
    if (!farm.isOwner) {
      redirect(
        `/farm/${farmId}?error=เฉพาะเจ้าของฟาร์มเท่านั้นที่สามารถแก้ไขได้`,
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breadcrumb */}
        <div className="breadcrumbs text-sm mb-6">
          <ul>
            <li>
              <Link href="/farms">ฟาร์มของฉัน</Link>
            </li>
            <li>
              <Link href={`/farm/${farm.id}`}>{farm.name}</Link>
            </li>
            <li>แก้ไข</li>
          </ul>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">แก้ไขฟาร์ม</h1>
          <p className="text-gray-600">
            ปรับปรุงข้อมูลฟาร์ม &quot;{farm.name}&quot;
          </p>
        </div>

        {/* Edit Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <FarmEditForm farm={farm} />
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <Link href={`/farm/${farm.id}`} className="btn btn-ghost">
            ← กลับไปหน้าฟาร์ม
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading farm edit page:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error mb-4">
          <span>เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม กรุณาลองใหม่อีกครั้ง</span>
        </div>
        <Link href="/farms" className="btn btn-primary">
          กลับไปหน้ารายการฟาร์ม
        </Link>
      </div>
    )
  }
}
