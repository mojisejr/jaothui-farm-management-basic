import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import FarmLayout from '@/components/layouts/FarmLayout'
import MemberList from '@/components/MemberList'
import InviteMemberForm from '@/components/InviteMemberForm'

const prisma = new PrismaClient()

interface PageProps {
  params: Promise<{ id: string }>
}

async function getFarmWithMembers(farmId: string, userId: string) {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          profileImage: true,
          createdAt: true,
        },
      },
      members: {
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profileImage: true,
              createdAt: true,
            },
          },
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
    return null
  }

  // Check if user is owner or member
  const isOwner = farm.ownerId === userId
  const isMember = farm.members.some((member) => member.profileId === userId)

  if (!isOwner && !isMember) {
    return null
  }

  return {
    ...farm,
    isOwner,
    isMember,
  }
}

export default async function FarmMembersPage({ params }: PageProps) {
  const { id: farmId } = await params

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
    const farm = await getFarmWithMembers(farmId, tokenPayload.userId)

    if (!farm) {
      redirect('/farms')
    }

    return (
      <FarmLayout
        title="จัดการสมาชิก"
        subtitle={`สมาชิกฟาร์ม ${farm.name}`}
        farmId={farmId}
        farmName={farm.name}
        variant="content"
        maxWidth="xl"
        showMembersButton={false}
      >
        <div className="space-y-8">
          {/* Invite Members Form - Only for owners */}
          {farm.isOwner && (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">เชิญสมาชิกใหม่</h3>
                <InviteMemberForm farmId={farmId} />
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">
                สมาชิกฟาร์ม ({farm.members.length + 1} คน)
              </h3>
              <MemberList
                farm={farm}
                currentUserId={tokenPayload.userId}
                isOwner={farm.isOwner}
              />
            </div>
          </div>
        </div>
      </FarmLayout>
    )
  } catch (error) {
    console.error('Error loading farm members page:', error)
    redirect('/farms')
  } finally {
    await prisma.$disconnect()
  }
}
