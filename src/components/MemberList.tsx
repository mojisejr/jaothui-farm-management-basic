'use client'

import { useState } from 'react'
import { Crown, User, Search } from 'lucide-react'
import MemberCard from './MemberCard'

interface Profile {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  profileImage: string | null
  createdAt: Date
}

interface FarmMember {
  profileId: string
  farmId: string
  profile: Profile
}

interface Farm {
  id: string
  name: string
  ownerId: string
  owner: Profile
  members: FarmMember[]
  isOwner: boolean
  isMember: boolean
}

interface MemberListProps {
  farm: Farm
  currentUserId: string
  isOwner: boolean
}

export default function MemberList({
  farm,
  currentUserId,
  isOwner,
}: MemberListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [isLeavingFarm, setIsLeavingFarm] = useState(false)

  // Combine owner and members for display
  const allMembers = [
    {
      ...farm.owner,
      isOwner: true,
      joinedAt: farm.owner.createdAt,
    },
    ...farm.members.map((member) => ({
      ...member.profile,
      isOwner: false,
      joinedAt: member.profile.createdAt,
    })),
  ]

  // Filter members based on search term
  const filteredMembers = allMembers.filter((member) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim()
    const searchString = `${fullName} ${member.phoneNumber}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  // Sort: owner first, then by name
  const sortedMembers = filteredMembers.sort((a, b) => {
    if (a.isOwner && !b.isOwner) return -1
    if (!a.isOwner && b.isOwner) return 1

    const nameA =
      `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.phoneNumber
    const nameB =
      `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.phoneNumber
    return nameA.localeCompare(nameB)
  })

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === farm.ownerId) {
      alert('ไม่สามารถลบเจ้าของฟาร์มได้')
      return
    }

    if (!confirm('คุณต้องการลบสมาชิกคนนี้หรือไม่?')) {
      return
    }

    setRemovingMemberId(memberId)
    try {
      const response = await fetch(`/api/farm/${farm.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh page to update the list
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'เกิดข้อผิดพลาดในการลบสมาชิก')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleLeaveFarm = async () => {
    if (!confirm('คุณต้องการออกจากฟาร์มนี้หรือไม่?')) return

    setIsLeavingFarm(true)
    try {
      const response = await fetch(`/api/farm/${farm.id}/leave`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        window.location.href = '/farms?success=ออกจากฟาร์มแล้ว'
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (_e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setIsLeavingFarm(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="ค้นหาสมาชิก..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="stats bg-base-200 w-full">
        <div className="stat">
          <div className="stat-title">สมาชิกทั้งหมด</div>
          <div className="stat-value text-primary">{allMembers.length}</div>
          <div className="stat-desc">รวมเจ้าของฟาร์ม 1 คน</div>
        </div>
      </div>

      {/* Members Grid */}
      {sortedMembers.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบสมาชิกที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.id === currentUserId}
              canRemove={isOwner && member.id !== farm.ownerId}
              onRemove={() => handleRemoveMember(member.id)}
              onLeave={
                member.id === currentUserId ? handleLeaveFarm : undefined
              }
              isRemoving={removingMemberId === member.id}
              isLeaving={isLeavingFarm && member.id === currentUserId}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="card bg-base-200">
        <div className="card-body py-4">
          <h4 className="font-medium mb-2">สัญลักษณ์</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>เจ้าของฟาร์ม</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span>สมาชิก</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
