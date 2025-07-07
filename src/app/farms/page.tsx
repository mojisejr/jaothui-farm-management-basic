import { redirect } from 'next/navigation'
import Link from 'next/link'
import FarmLayout from '@/components/layouts/FarmLayout'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

interface FarmData {
  id: string
  name: string
  province: string
  size: number | null
  description: string | null
  isOwner: boolean
  isMember: boolean
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
  try {
    // Get and verify token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      redirect('/login')
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      redirect('/profile')
    }

    const userId = tokenPayload.userId

    // Fetch owned farms
    const ownedFarms = await prisma.farm.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch member farms
    const memberFarms = await prisma.farm.findMany({
      where: {
        members: {
          some: { profileId: userId },
        },
        ownerId: { not: userId }, // Exclude owned farms to avoid duplicates
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Combine farms with proper flags
    const allFarms = [
      ...ownedFarms.map((farm) => ({
        ...farm,
        isOwner: true,
        isMember: false,
      })),
      ...memberFarms.map((farm) => ({
        ...farm,
        isOwner: false,
        isMember: true,
      })),
    ]

    const stats = {
      totalFarms: allFarms.length,
      totalAnimals: allFarms.reduce(
        (sum, farm) => sum + farm._count.animals,
        0,
      ),
    }

    return {
      farms: allFarms,
      stats,
    }
  } catch (error) {
    console.error('Error fetching farms:', error)
    throw error
  } finally {
    await prisma.$disconnect()
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
          {farm.isMember && (
            <div className="badge badge-secondary badge-sm">สมาชิก</div>
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
