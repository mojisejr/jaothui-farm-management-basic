import { Profile } from '@/types/database'
import { JWTUser } from '@/types/auth'
import ImageUpload from './ImageUpload'

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

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <ImageUpload
              currentImage={profile?.profileImage || ''}
              onImageSelect={(_file, _preview) => {
                // Handle image change if needed
              }}
              disabled={true}
            />

            {/* Quick Stats */}
            <div className="stats stats-vertical shadow bg-base-200">
              <div className="stat">
                <div className="stat-title">สถานะบัญชี</div>
                <div className="stat-value text-lg text-success">ใช้งานได้</div>
                <div className="stat-desc">บัญชีถูกต้อง</div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">👤</span>
                ข้อมูลส่วนตัว
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">ชื่อ</span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    {profile?.firstName || 'ยังไม่ได้กรอก'}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">นามสกุล</span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    {profile?.lastName || 'ยังไม่ได้กรอก'}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📞</span>
                ข้อมูลการติดต่อ
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      หมายเลขโทรศัพท์
                    </span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    <span className="badge badge-success badge-sm mr-2">
                      ยืนยันแล้ว
                    </span>
                    {user.phone}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">อีเมล</span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    {profile?.email || user.email || 'ยังไม่ได้เชื่อมต่อ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">⚙️</span>
                ข้อมูลบัญชี
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      วันที่สร้างบัญชี
                    </span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('th-TH')
                      : 'ไม่ทราบ'}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">อัพเดทล่าสุด</span>
                  </label>
                  <div className="input input-bordered bg-base-200 flex items-center">
                    {profile?.updatedAt
                      ? new Date(profile.updatedAt).toLocaleDateString('th-TH')
                      : user.updated_at
                        ? new Date(user.updated_at).toLocaleDateString('th-TH')
                        : 'ไม่ทราบ'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
