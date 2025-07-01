import { JWTUser } from '@/types/auth'
import { Profile } from '@/types/database'
import { Edit, Mail, Phone, Calendar, User as UserIcon } from 'lucide-react'
import { formatPhoneNumber, formatDateThai } from '@/lib/utils'

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit size={16} />
          แก้ไข
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <UserIcon size={48} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            {profile?.firstName || user.user_metadata.firstName || 'ไม่ระบุ'}{' '}
            {profile?.lastName || user.user_metadata.lastName || ''}
          </h3>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="text-gray-400" size={20} />
            <div>
              <label className="text-sm font-medium text-gray-500">
                เบอร์โทรศัพท์
              </label>
              <p className="text-gray-800">
                {user.phone ? formatPhoneNumber(user.phone) : 'ไม่ระบุ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="text-gray-400" size={20} />
            <div>
              <label className="text-sm font-medium text-gray-500">อีเมล</label>
              <p className="text-gray-800">{user.email || 'ไม่ระบุ'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <label className="text-sm font-medium text-gray-500">
                วันที่สมัครสมาชิก
              </label>
              <p className="text-gray-800">
                {user.created_at
                  ? formatDateThai(new Date(user.created_at))
                  : profile?.createdAt
                    ? formatDateThai(profile.createdAt)
                    : 'ไม่ระบุ'}
              </p>
            </div>
          </div>

          {profile?.phoneNumber && profile.phoneNumber !== user.phone && (
            <div className="flex items-start gap-3">
              <Phone className="text-gray-400 mt-1" size={20} />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  เบอร์โทรสำรอง
                </label>
                <p className="text-gray-800">
                  {formatPhoneNumber(profile.phoneNumber)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Profile Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {profile?.createdAt
                ? formatDateThai(profile.createdAt)
                : user.created_at
                  ? formatDateThai(new Date(user.created_at))
                  : 'ไม่ระบุ'}
            </p>
            <p className="text-sm text-gray-500">วันที่สร้างโปรไฟล์</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {profile?.updatedAt
                ? formatDateThai(profile.updatedAt)
                : user.updated_at
                  ? formatDateThai(new Date(user.updated_at))
                  : user.created_at
                    ? formatDateThai(new Date(user.created_at))
                    : 'ไม่ระบุ'}
            </p>
            <p className="text-sm text-gray-500">อัปเดตล่าสุด</p>
          </div>
        </div>
      </div>
    </div>
  )
}
