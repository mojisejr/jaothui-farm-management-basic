import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import FarmLayout from '@/components/layouts/FarmLayout'
import FarmEditForm from '@/components/FarmEditForm'
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
}

async function getFarmForEdit(farmId: string): Promise<FarmDetail> {
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

    if (!isOwner && !isMember) {
      redirect('/farms?error=ไม่มีสิทธิ์เข้าถึงฟาร์มนี้')
    }

    // ตรวจสอบว่าเป็นเจ้าของหรือไม่
    if (!isOwner) {
      redirect(
        `/farm/${farmId}/dashboard?error=เฉพาะเจ้าของฟาร์มเท่านั้นที่สามารถแก้ไขได้`,
      )
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
