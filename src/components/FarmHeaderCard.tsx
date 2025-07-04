import { MapPin, Settings, Users, Crown } from 'lucide-react'
import Link from 'next/link'

interface FarmHeaderCardProps {
  farm: {
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
}

export default function FarmHeaderCard({ farm }: FarmHeaderCardProps) {
  const ownerName =
    farm.owner.firstName && farm.owner.lastName
      ? `${farm.owner.firstName} ${farm.owner.lastName}`
      : farm.owner.phoneNumber

  return (
    <div className="card bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-6">
      <div className="card-body p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="card-title text-lg md:text-xl text-base-content">
                {farm.name}
              </h2>
              {farm.isOwner && (
                <div className="badge badge-primary badge-sm gap-1">
                  <Crown className="w-3 h-3" />
                  เจ้าของ
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-base-content/70 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>{farm.province}</span>
              {farm.size && (
                <>
                  <span className="mx-2">•</span>
                  <span>{farm.size.toLocaleString()} ไร่</span>
                </>
              )}
            </div>

            {farm.description && (
              <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                {farm.description}
              </p>
            )}

            <div className="text-xs text-base-content/60">
              เจ้าของ: {ownerName}
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex md:flex-col gap-3 md:gap-2 md:items-end">
            {/* Stats */}
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold text-primary">
                  {farm._count.animals}
                </div>
                <div className="text-xs text-base-content/60">สัตว์</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold text-secondary">
                  {farm._count.members}
                </div>
                <div className="text-xs text-base-content/60">สมาชิก</div>
              </div>
            </div>

            {/* Actions */}
            {farm.isOwner && (
              <div className="flex gap-2">
                {/* Edit Farm */}
                <Link
                  href={`/farm/${farm.id}/edit`}
                  className="btn btn-primary btn-sm gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span className="hidden md:inline">จัดการฟาร์ม</span>
                  <span className="md:hidden">แก้ไข</span>
                </Link>

                {/* Manage Members */}
                <Link
                  href={`/farm/${farm.id}/members`}
                  className="btn btn-secondary btn-sm gap-1"
                >
                  <Users className="w-3 h-3" />
                  <span className="hidden md:inline">สมาชิก</span>
                  <span className="md:hidden">สมาชิก</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
