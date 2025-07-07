import { Profile } from '@/types/database'
import { JWTUser } from '@/types/auth'
import Image from 'next/image'

interface ProfileViewProps {
  user: JWTUser
  profile: Profile | null
  onEdit: () => void
}

export default function ProfileView({
  user,
  profile,
  onEdit,
}: ProfileViewProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Header with Edit Button */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="card-title text-2xl">ข้อมูลส่วนตัว</h2>
            <p className="text-base-content/70 mt-1">
              ข้อมูลพื้นฐานและการติดต่อของคุณ
            </p>
          </div>
          <button onClick={onEdit} className="btn btn-primary btn-sm">
            แก้ไข
          </button>
        </div>

        {/* Mobile-first layout */}
        <div className="space-y-6">
          {/* Profile Image Section - Compact for mobile */}
          <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
            <div className="avatar">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {profile?.profileImage ? (
                  <Image 
                    src={profile.profileImage} 
                    alt="Profile" 
                    width={64}
                    height={64}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'ยังไม่ได้กรอกชื่อ'}
              </h3>
              <p className="text-sm text-base-content/70">{user.phone}</p>
              <div className="badge badge-success badge-sm mt-1">ใช้งานได้</div>
            </div>
          </div>

          {/* Essential Information Only */}
          <div className="space-y-4">
            {/* Personal Information - Simplified */}
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>👤</span>
                ข้อมูลส่วนตัว
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">ชื่อ</span>
                  <span className="font-medium">{profile?.firstName || 'ยังไม่ได้กรอก'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">นามสกุล</span>
                  <span className="font-medium">{profile?.lastName || 'ยังไม่ได้กรอก'}</span>
                </div>
                {profile?.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70">อีเมล</span>
                    <span className="font-medium">{profile.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
