import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { COOKIE } from '@/constants/cookies'
import FarmLayout from '@/components/layouts/FarmLayout'

interface FarmData {
  id: string
  name: string
  province: string
  size: number | null
  description: string | null
  isOwner: boolean
  owner: {
    firstName: string | null
    lastName: string | null
    phoneNumber: string
  }
  _count: {
    animals: number
    members: number
  }
}

interface FarmResponse {
  farms: FarmData[]
  stats: {
    totalFarms: number
    totalAnimals: number
  }
}

async function getFarms(): Promise<FarmResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE.ACCESS)?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/farm`, {
      headers: {
        Cookie: `${COOKIE.ACCESS}=${token}`,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    })

    if (response.status === 401) {
      redirect('/profile')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch farms')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching farms:', error)
    throw error
  }
}

function FarmCard({ farm }: { farm: FarmData }) {
  const ownerName =
    farm.owner.firstName && farm.owner.lastName
      ? `${farm.owner.firstName} ${farm.owner.lastName}`
      : farm.owner.phoneNumber

  return (
    <div className="card bg-base-100 shadow-xl border">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h3 className="card-title text-lg">{farm.name}</h3>
          {farm.isOwner && (
            <div className="badge badge-primary badge-sm">เจ้าของ</div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">จังหวัด:</span> {farm.province}
          </p>
          {farm.size && (
            <p>
              <span className="font-medium">ขนาด:</span>{' '}
              {farm.size.toLocaleString()} ไร่
            </p>
          )}
          <p>
            <span className="font-medium">เจ้าของ:</span> {ownerName}
          </p>
        </div>

        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>สัตว์: {farm._count.animals} ตัว</span>
          <span>สมาชิก: {farm._count.members} คน</span>
        </div>

        <div className="card-actions justify-end mt-4">
          <Link
            href={`/farm/${farm.id}/dashboard`}
            className="btn btn-primary btn-sm"
          >
            ดูรายละเอียด
          </Link>
          {farm.isOwner && (
            <Link
              href={`/farm/${farm.id}/edit`}
              className="btn btn-secondary btn-sm"
            >
              แก้ไข
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: string
}) {
  return (
    <div className="stat bg-base-100 border rounded-lg">
      <div className="stat-figure text-primary">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="stat-title text-sm">{title}</div>
      <div className="stat-value text-2xl text-primary">
        {value.toLocaleString()}
      </div>
    </div>
  )
}

export default async function FarmsPage() {
  try {
    const { farms, stats } = await getFarms()

    return (
      <FarmLayout
        title="ฟาร์มของฉัน"
        subtitle="จัดการและติดตามฟาร์มทั้งหมดของคุณ"
        variant="list"
        maxWidth="full"
        showCreateButton={true}
        backUrl="/profile"
      >
        <div className="container mx-auto max-w-6xl">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="ฟาร์มทั้งหมด"
              value={stats.totalFarms}
              icon="🏠"
            />
            <StatsCard
              title="สัตว์ทั้งหมด"
              value={stats.totalAnimals}
              icon="🐄"
            />
            <div className="stat bg-base-100 border rounded-lg">
              <div className="stat-figure text-primary">
                <span className="text-2xl">👥</span>
              </div>
              <div className="stat-title text-sm">ฟาร์มที่เป็นเจ้าของ</div>
              <div className="stat-value text-2xl text-primary">
                {farms.filter((f) => f.isOwner).length}
              </div>
            </div>
            <div className="stat bg-base-100 border rounded-lg">
              <div className="stat-figure text-primary">
                <span className="text-2xl">🤝</span>
              </div>
              <div className="stat-title text-sm">ฟาร์มที่เป็นสมาชิก</div>
              <div className="stat-value text-2xl text-primary">
                {farms.filter((f) => !f.isOwner).length}
              </div>
            </div>
          </div>

          {/* Farm List */}
          {farms.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">รายการฟาร์ม</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {farms.map((farm) => (
                  <FarmCard key={farm.id} farm={farm} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">ยังไม่มีฟาร์ม</h3>
              <p className="text-gray-600 mb-6">
                เริ่มต้นการเลี้ยงสัตว์ด้วยการสร้างฟาร์มแรกของคุณ
              </p>
              <Link href="/farm/create" className="btn btn-primary">
                สร้างฟาร์มแรก
              </Link>
            </div>
          )}
        </div>
      </FarmLayout>
    )
  } catch (error) {
    return (
      <FarmLayout
        title="เกิดข้อผิดพลาด"
        subtitle="ไม่สามารถโหลดข้อมูลฟาร์มได้"
        backUrl="/profile"
        error={error as Error}
        onRetry={() => window.location.reload()}
      >
        <div className="container mx-auto text-center">
          <div className="alert alert-error">
            <span>เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม กรุณาลองใหม่อีกครั้ง</span>
          </div>
        </div>
      </FarmLayout>
    )
  }
}
