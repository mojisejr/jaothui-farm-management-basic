import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
} from 'lucide-react'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  notes: string | null
  activityDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  animal: Animal
}

interface ActivityCardProps {
  activity: Activity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  // แปลงสถานะเป็นภาษาไทย
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'รอดำเนินการ',
          color: 'text-yellow-600 bg-yellow-50',
          icon: Clock,
        }
      case 'IN_PROGRESS':
        return {
          label: 'กำลังดำเนินการ',
          color: 'text-blue-600 bg-blue-50',
          icon: PlayCircle,
        }
      case 'COMPLETED':
        return {
          label: 'เสร็จสิ้น',
          color: 'text-green-600 bg-green-50',
          icon: CheckCircle2,
        }
      case 'CANCELLED':
        return {
          label: 'ยกเลิก',
          color: 'text-red-600 bg-red-50',
          icon: XCircle,
        }
      default:
        return {
          label: status,
          color: 'text-gray-600 bg-gray-50',
          icon: PauseCircle,
        }
    }
  }

  // แปลงวันที่เป็น Buddhist Era และฟอร์แมต
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  // แปลงวันที่สร้างเป็นเวลาที่ผ่านมา
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} วันที่แล้ว`
    } else if (diffHours > 0) {
      return `${diffHours} ชั่วโมงที่แล้ว`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} นาทีที่แล้ว`
    } else {
      return 'เมื่อสักครู่'
    }
  }

  const statusInfo = getStatusInfo(activity.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base-content text-lg">
              {activity.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              สัตว์: {activity.animal.name}
              {activity.animal.animalType && (
                <span className="text-gray-400">
                  {' '}
                  • {activity.animal.animalType.name}
                </span>
              )}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Notes */}
        {activity.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">หมายเหตุ:</span> {activity.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatActivityDate(activity.activityDate)}
          </div>
          <div>สร้างเมื่อ {getTimeAgo(activity.createdAt)}</div>
        </div>
      </div>
    </div>
  )
}
