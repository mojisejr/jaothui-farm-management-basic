import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import prisma from '@/lib/prisma'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

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
  // ตรวจสอบ authentication
  const accessToken = await getAccessTokenFromCookies()
  if (!accessToken) {
    redirect('/login')
  }

  const tokenPayload = verifyAccessToken(accessToken)
  if (!tokenPayload) {
    redirect('/login')
  }

  try {
    // ค้นหาฟาร์ม
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        animals: {
          select: {
            id: true,
            name: true,
            microchip: true,
          },
        },
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
    })

    if (!farm) {
      notFound()
    }

    // ตรวจสอบสิทธิ์การเข้าถึง (เจ้าของหรือสมาชิก)
    const isOwner = farm.ownerId === tokenPayload.userId
    const isMember = await prisma.farmMember.findFirst({
      where: {
        farmId: farm.id,
        profileId: tokenPayload.userId,
      },
    })

    // If requester is owner but not yet recorded in farm_members, insert with OWNER role (sync legacy data)
    if (isOwner && !isMember) {
      try {
        await prisma.farmMember.create({
          data: {
            farmId: farm.id,
            profileId: tokenPayload.userId,
            role: 'OWNER',
          },
        })
      } catch (err) {
        console.error('Error syncing owner FarmMember:', err)
      }
    }

    if (!isOwner && !isMember) {
      redirect('/farms?error=ไม่มีสิทธิ์เข้าถึงฟาร์มนี้')
    }

    return {
      ...farm,
      isOwner,
      isMember: !!isMember,
    } as FarmDetail
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

    return <DashboardLayout farmId={farm.id} farmName={farm.name} farm={farm} />
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
