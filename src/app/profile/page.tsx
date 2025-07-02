import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { redirect } from 'next/navigation'
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

  // Get profile data
  const profile = await prisma.profile.findUnique({
    where: { id: tokenPayload.userId },
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

  await prisma.$disconnect()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            โปรไฟล์ของฉัน
          </h1>
          <p className="text-gray-600">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </div>

        <ProfileCard
          user={user}
          profile={profile}
          updateProfileAction={updateProfile}
        />

        {/* Quick Links */}
        <ProfileLinks />
      </div>
    </div>
  )
}
