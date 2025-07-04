export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { PageLayout } from '@/components/layouts/PageLayout'
import InvitationActions from '@/components/invitations/InvitationActions'
import JaothuiLogo from '@/components/JaothuiLogo'
import { Phone, User } from 'lucide-react'

const prisma = new PrismaClient()

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      farm: {
        select: { id: true, name: true },
      },
      inviter: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  if (!invitation) {
    redirect('/404')
  }

  if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
    return (
      <PageLayout
        title="คำเชิญไม่สามารถใช้งานได้"
        subtitle="คำเชิญหมดอายุหรือใช้งานไปแล้ว"
        variant="container"
        dashboardLogo={<JaothuiLogo />}
      >
        <p className="text-center py-8">คำเชิญนี้ไม่สามารถใช้งานได้</p>
      </PageLayout>
    )
  }

  // Auth check (optional)
  const accessToken = await getAccessTokenFromCookies()
  let phoneMatch = false
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) {
      const profile = await prisma.profile.findUnique({
        where: { id: payload.userId },
        select: { phoneNumber: true },
      })
      phoneMatch = profile?.phoneNumber === invitation.phoneNumber
    }
  }

  const inviterName =
    invitation.inviter.firstName || invitation.inviter.lastName
      ? `${invitation.inviter.firstName ?? ''} ${invitation.inviter.lastName ?? ''}`.trim()
      : 'ไม่ระบุชื่อ'

  return (
    <PageLayout
      title="คำเชิญเข้าร่วมฟาร์ม"
      subtitle={`ฟาร์ม: ${invitation.farm.name}`}
      variant="container"
      dashboardLogo={<JaothuiLogo />}
      showBackButton={false}
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body space-y-2">
            <h3 className="card-title text-lg">รายละเอียดคำเชิญ</h3>
            <p className="flex items-center gap-2">
              <User className="w-4 h-4" /> ผู้เชิญ: {inviterName}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> เบอร์: {invitation.phoneNumber}
            </p>
            <p>หมดอายุ: {invitation.expiresAt.toLocaleDateString('th-TH')}</p>
          </div>
        </div>

        {!phoneMatch && (
          <div className="alert alert-warning">
            <span>
              กรุณาเข้าสู่ระบบด้วยเบอร์โทร {invitation.phoneNumber}{' '}
              เพื่อยืนยันคำเชิญ
            </span>
          </div>
        )}

        {phoneMatch ? (
          <InvitationActions token={token} />
        ) : (
          <div className="flex justify-center">
            <a
              href={`/login?next=/invite/${token}`}
              className="btn btn-primary"
            >
              เข้าสู่ระบบเพื่อยอมรับ
            </a>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
