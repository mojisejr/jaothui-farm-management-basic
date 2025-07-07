import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import ProfileLayout from '@/components/layouts/ProfileLayout'
import ProfileCard from '@/components/profile/ProfileCard'
import ProfileLinks from '@/components/profile/ProfileLinks'
import { updateProfile } from './actions'

const prisma = new PrismaClient()

export default async function ProfilePage() {
  // Get and verify access token
  const accessToken = await getAccessTokenFromCookies()
  if (!accessToken) {
    redirect('/login')
  }

  const tokenPayload = verifyAccessToken(accessToken)
  if (!tokenPayload) {
    redirect('/login')
  }

  try {
    // Get profile data
    const profile = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
    })

    // Check if user owns a farm
    const ownedFarm = await prisma.farm.findFirst({
      where: { ownerId: tokenPayload.userId },
    })

    // Create a user object compatible with JWTUser interface
    const user = {
      id: tokenPayload.userId,
      phone: tokenPayload.phoneNumber,
      email: null, // Will be available from profile in future updates
      user_metadata: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
      },
      created_at: profile?.createdAt?.toISOString(),
      updated_at: profile?.updatedAt?.toISOString(),
    }

    return (
      <ProfileLayout
        title="โปรไฟล์ของฉัน"
        subtitle="จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ"
        variant="default"
        background="gradient"
        showThemeSelector={true}
        showProfileQuickActions={false}
      >
        {/* Main Profile Content */}
        <div className="space-y-8">
          {/* Profile Card - Keep existing edit/view logic */}
          <ProfileCard
            user={user}
            profile={profile}
            updateProfileAction={updateProfile}
          />

          {/* Profile Links - Keep as navigation shortcuts */}
          <ProfileLinks hasOwnedFarm={!!ownedFarm} />
        </div>
      </ProfileLayout>
    )
  } catch (error) {
    console.error('Error loading profile page:', error)

    return (
      <ProfileLayout
        title="เกิดข้อผิดพลาด"
        subtitle="ไม่สามารถโหลดข้อมูลโปรไฟล์ได้"
        backUrl="/farms"
        error={error as Error}
        onRetry={() => window.location.reload()}
      >
        <div className="text-center">
          <div className="alert alert-error mb-4">
            <span>
              เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์ กรุณาลองใหม่อีกครั้ง
            </span>
          </div>
          <a href="/farms" className="btn btn-primary">
            กลับไปหน้าฟาร์มของฉัน
          </a>
        </div>
      </ProfileLayout>
    )
  } finally {
    await prisma.$disconnect()
  }
}
