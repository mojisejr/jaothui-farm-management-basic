import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { AnimalCreateFormWrapper } from '@/components/forms/AnimalCreateFormWrapper'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, PawPrint } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    farmId?: string
  }>
}

export const metadata: Metadata = {
  title: 'ลงทะเบียนสัตว์ใหม่ | Jaothui Farm Management',
  description: 'เพิ่มสัตว์เลี้ยงใหม่เข้าสู่ระบบจัดการฟาร์ม',
}

export default async function AnimalCreatePage({ searchParams }: Props) {
  // Check authentication
  const accessToken = await getAccessTokenFromCookies()
  if (!accessToken) {
    redirect('/login')
  }

  const tokenPayload = verifyAccessToken(accessToken)
  if (!tokenPayload) {
    redirect('/login')
  }

  // Get farmId from search params
  const { farmId } = await searchParams

  if (!farmId) {
    redirect('/farms')
  }

  // Verify user has access to this farm
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      OR: [
        { ownerId: tokenPayload.userId },
        {
          members: {
            some: {
              profileId: tokenPayload.userId,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      _count: {
        select: {
          animals: true,
        },
      },
    },
  })

  if (!farm) {
    redirect('/farms')
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/farm/${farmId}`} className="btn btn-ghost btn-sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              กลับไปฟาร์ม
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-base-content mb-2">
              <PawPrint className="w-8 h-8 inline mr-2" />
              ลงทะเบียนสัตว์ใหม่
            </h1>
            <div className="text-base-content/60">
              <p className="text-lg font-medium text-primary">{farm.name}</p>
              <p className="text-sm">
                จังหวัด {farm.province} • สัตว์ทั้งหมด {farm._count.animals} ตัว
              </p>
            </div>
          </div>
        </div>

        {/* Animal Registration Form */}
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <AnimalCreateFormWrapper farmId={farmId} />
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-8 text-center">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title justify-center text-lg">
                💡 ข้อมูลที่ควรรู้
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-base-content/70">
                <div>
                  <h4 className="font-semibold text-base-content mb-2">
                    🏷️ เลขไมโครชิป
                  </h4>
                  <p>ระบบจะสร้างเลขไมโครชิปอัตโนมัติตามมาตรฐานไทย</p>
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-2">
                    📅 วันเกิด
                  </h4>
                  <p>ใช้ปฏิทินพุทธศักราช (พ.ศ.) ตามมาตรฐานไทย</p>
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-2">
                    ⚖️ น้ำหนัก/ส่วนสูง
                  </h4>
                  <p>หน่วยเป็นกิโลกรัม (กก.) และเซนติเมตร (ซม.)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-2">
                    🔐 ความปลอดภัย
                  </h4>
                  <p>ข้อมูลสัตว์ของคุณได้รับการป้องกันอย่างดี</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
