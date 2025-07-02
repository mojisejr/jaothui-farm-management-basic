import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DeleteFarmButton from '@/components/DeleteFarmButton'
import AddMemberButton from '@/components/AddMemberButton'
import { COOKIE } from '@/constants/cookies'

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
    redirect('/auth/login')
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

    const data = await response.json()
    return data.farm as FarmDetail
  } catch (error) {
    console.error('Error fetching farm details:', error)
    throw error
  }
}

function formatThaiDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const farm = await getFarmDetail(id)

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="breadcrumbs text-sm mb-6">
          <ul>
            <li>
              <Link href="/farms">ฟาร์มของฉัน</Link>
            </li>
            <li>
              {`${farm.owner.firstName ?? ''} ${farm.owner.lastName ?? ''}`.trim() ||
                farm.owner.phoneNumber}
            </li>
          </ul>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{farm.name}</h1>
              <div className="badge">
                {farm.isOwner ? (
                  <span className="text-primary">เจ้าของ</span>
                ) : (
                  <span className="text-secondary">สมาชิก</span>
                )}
              </div>
            </div>
            <p className="text-gray-600">จังหวัด{farm.province}</p>
          </div>

          {farm.isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/farm/${farm.id}/edit`}
                className="btn btn-primary btn-sm"
              >
                ✏️ แก้ไขฟาร์ม
              </Link>
              <DeleteFarmButton farmId={farm.id} />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Farm Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">ข้อมูลฟาร์ม</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      ตำแหน่ง
                    </h3>
                    <p className="flex items-center gap-2">
                      <span>📍</span>
                      <span>จังหวัด{farm.province}</span>
                    </p>
                  </div>

                  {farm.size && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">
                        ขนาดพื้นที่
                      </h3>
                      <p className="flex items-center gap-2">
                        <span>📐</span>
                        <span>{farm.size.toLocaleString()} ไร่</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      เจ้าของฟาร์ม
                    </h3>
                    <p className="flex items-center gap-2">
                      <span>👤</span>
                      <span>
                        {`${farm.owner.firstName ?? ''} ${farm.owner.lastName ?? ''}`.trim() ||
                          farm.owner.phoneNumber}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      วันที่สร้าง
                    </h3>
                    <p className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatThaiDate(farm.createdAt)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {farm.description && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    รายละเอียดเพิ่มเติม
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {farm.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Statistics & Actions */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">สถิติฟาร์ม</h2>
                <div className="space-y-4">
                  <div className="stat bg-primary/10 rounded-lg p-4">
                    <div className="stat-figure text-primary">
                      <span className="text-2xl">🐄</span>
                    </div>
                    <div className="stat-title text-sm">สัตว์ทั้งหมด</div>
                    <div className="stat-value text-xl text-primary">
                      {farm._count.animals}
                    </div>
                    <div className="stat-desc text-xs">ตัว</div>
                  </div>

                  <div className="stat bg-secondary/10 rounded-lg p-4">
                    <div className="stat-figure text-secondary">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="stat-title text-sm">สมาชิก</div>
                    <div className="stat-value text-xl text-secondary">
                      {farm._count.members}
                    </div>
                    <div className="stat-desc text-xs">คน</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">การจัดการ</h2>
                <div className="space-y-2">
                  <Link
                    href={`/animals?farm=${farm.id}`}
                    className="btn btn-outline w-full justify-start"
                  >
                    🐄 จัดการสัตว์
                  </Link>
                  <AddMemberButton farmId={farm.id} />
                  <Link
                    href={`/reports?farm=${farm.id}`}
                    className="btn btn-outline w-full justify-start"
                  >
                    📊 รายงาน
                  </Link>
                </div>
              </div>
            </div>

            {/* Farm Status */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">สถานะฟาร์ม</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>สร้างเมื่อ:</span>
                    <span>{formatThaiDate(farm.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>อัปเดตล่าสุด:</span>
                    <span>{formatThaiDate(farm.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>สถานะ:</span>
                    <span className="badge badge-success">ใช้งานอยู่</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading farm details:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม กรุณาลองใหม่อีกครั้ง</span>
        </div>
        <Link href="/farms" className="btn btn-primary mt-4">
          กลับไปหน้ารายการฟาร์ม
        </Link>
      </div>
    )
  }
}
