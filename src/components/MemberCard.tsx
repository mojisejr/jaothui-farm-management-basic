'use client'

import {
  Crown,
  User,
  Phone,
  Calendar,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'

interface Member {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  profileImage: string | null
  isOwner: boolean
  joinedAt: Date
}

interface MemberCardProps {
  member: Member
  isCurrentUser: boolean
  canRemove: boolean
  onRemove: () => void
  onLeave?: () => void
  isRemoving?: boolean
  isLeaving?: boolean
}

export default function MemberCard({
  member,
  isCurrentUser,
  canRemove,
  onRemove,
  onLeave,
  isRemoving = false,
  isLeaving = false,
}: MemberCardProps) {
  const displayName =
    member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.firstName || member.lastName || 'ไม่ระบุชื่อ'

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
    return phone
  }

  const formatJoinDate = (date: Date): string => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div
      className={`card bg-base-100 shadow-sm border ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="card-body p-4">
        {/* Header with avatar and actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {member.profileImage ? (
                  <Image
                    src={member.profileImage}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>

            {/* Name and role */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{displayName}</h4>
                {member.isOwner ? (
                  <Crown className="w-4 h-4 text-yellow-500" />
                ) : (
                  <User className="w-4 h-4 text-blue-500" />
                )}
                {isCurrentUser && (
                  <span className="badge badge-primary badge-xs">คุณ</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {member.isOwner ? 'เจ้าของฟาร์ม' : 'สมาชิก'}
              </p>
            </div>
          </div>

          {/* Actions menu */}
          {(canRemove || (isCurrentUser && !member.isOwner)) && (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm btn-circle"
              >
                <MoreVertical className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                {canRemove && (
                  <li>
                    <button
                      onClick={onRemove}
                      disabled={isRemoving}
                      className={`text-red-600 hover:bg-red-50 ${isRemoving ? 'loading loading-xs' : ''}`}
                    >
                      {!isRemoving && <Trash2 className="w-4 h-4" />}
                      {isRemoving ? 'กำลังลบ...' : 'ลบสมาชิก'}
                    </button>
                  </li>
                )}
                {isCurrentUser && !member.isOwner && onLeave && (
                  <li>
                    <button 
                      onClick={onLeave} 
                      disabled={isLeaving}
                      className={`hover:bg-base-200 ${isLeaving ? 'loading loading-xs' : ''}`}
                    >
                      {isLeaving ? 'กำลังออก...' : 'ออกจากฟาร์ม'}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{formatPhoneNumber(member.phoneNumber)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>เข้าร่วม {formatJoinDate(member.joinedAt)}</span>
          </div>
        </div>

        {/* Member status */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">สถานะ</span>
            <span className="badge badge-success badge-sm">เข้าร่วมแล้ว</span>
          </div>
        </div>
      </div>
    </div>
  )
}
