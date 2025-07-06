'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  User,
  FileText,
  Tag,
  AlertCircle,
  Repeat,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { FarmLayout } from '@/components/layouts/FarmLayout'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
  farm: {
    id: string
    name: string
    owner: {
      id: string
      firstName: string | null
      lastName: string | null
    }
  }
}

interface ScheduleDetail {
  id: string
  title: string
  description: string | null
  notes: string | null
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRecurring: boolean
  recurrenceType: string | null
  animalId: string
  createdAt: string
  updatedAt: string
  animal: Animal
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'รอดำเนินการ',
    color: 'badge-warning',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'กำลังดำเนินการ',
    color: 'badge-info',
    icon: Clock,
  },
  COMPLETED: {
    label: 'เสร็จสิ้น',
    color: 'badge-success',
    icon: Check,
  },
  CANCELLED: {
    label: 'ยกเลิก',
    color: 'badge-error',
    icon: X,
  },
}

const RECURRENCE_CONFIG = {
  none: 'ไม่ซ้ำ',
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  quarterly: 'รายไตรมาส',
  yearly: 'รายปี',
}

export default function ScheduleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = params.id as string
  
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/schedule/${scheduleId}`)
        
        if (!response.ok) {
          throw new Error('ไม่พบกำหนดการที่ต้องการ')
        }

        const data = await response.json()
        setSchedule(data.schedule)
      } catch (error) {
        console.error('Fetch error:', error)
        setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [scheduleId])

  const updateStatus = async (newStatus: ScheduleDetail['status']) => {
    if (!schedule || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('ไม่สามารถอัปเดตสถานะได้')
      }

      const data = await response.json()
      setSchedule(data.schedule)
      toast.success('อัปเดตสถานะเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteSchedule = async () => {
    if (!schedule || isUpdating) return
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบกำหนดการนี้?')) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('ไม่สามารถลบกำหนดการได้')
      }

      toast.success('ลบกำหนดการเรียบร้อยแล้ว')
      router.push(`/schedule?farmId=${schedule.animal.farm.id}`)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('เกิดข้อผิดพลาดในการลบกำหนดการ')
    } finally {
      setIsUpdating(false)
    }
  }

  const convertToActivity = async () => {
    if (!schedule || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/activity/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: schedule.title,
          description: schedule.description,
          notes: schedule.notes,
          activityDate: schedule.scheduledDate,
          status: 'COMPLETED',
          animalId: schedule.animalId,
        }),
      })

      if (!response.ok) {
        throw new Error('ไม่สามารถแปลงเป็นกิจกรรมได้')
      }

      // Update schedule status to completed
      await updateStatus('COMPLETED')
      toast.success('แปลงเป็นกิจกรรมเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Convert error:', error)
      toast.error('เกิดข้อผิดพลาดในการแปลงเป็นกิจกรรม')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      thaiDate: date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-error" />
          <h1 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-base-content/70 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            กลับไปหน้าก่อน
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[schedule.status]
  const StatusIcon = statusConfig.icon
  const scheduledDate = formatDate(schedule.scheduledDate)
  const createdDate = formatDate(schedule.createdAt)

  return (
    <FarmLayout
      title={schedule.title}
      subtitle="รายละเอียดกำหนดการ"
      farmId={schedule.animal.farm.id}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={16} />
            กลับ
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/schedule/edit/${schedule.id}?farmId=${schedule.animal.farm.id}`)}
              className="btn btn-outline btn-sm"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">แก้ไข</span>
            </button>
            
            <button
              onClick={deleteSchedule}
              disabled={isUpdating}
              className="btn btn-error btn-outline btn-sm"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">ลบ</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{schedule.title}</h1>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`badge ${statusConfig.color}`}>
                        <StatusIcon size={12} className="mr-1" />
                        {statusConfig.label}
                      </div>
                      {schedule.isRecurring && (
                        <div className="badge badge-info">
                          <Repeat size={12} className="mr-1" />
                          {RECURRENCE_CONFIG[schedule.recurrenceType as keyof typeof RECURRENCE_CONFIG] || 'ซ้ำ'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {schedule.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      คำอธิบาย
                    </h3>
                    <p className="text-base-content/80">{schedule.description}</p>
                  </div>
                )}

                {schedule.notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Tag size={16} />
                      หมายเหตุ
                    </h3>
                    <div className="bg-base-200 rounded-lg p-3">
                      <p className="text-base-content/80">{schedule.notes}</p>
                    </div>
                  </div>
                )}

                {/* Date & Time Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h4 className="font-medium text-sm text-base-content/70 mb-1">วันที่กำหนด</h4>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span>{scheduledDate.thaiDate}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={16} className="text-primary" />
                      <span>{scheduledDate.time}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-base-content/70 mb-1">วันที่สร้าง</h4>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-base-content/50" />
                      <span className="text-sm">{createdDate.thaiDate}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={16} className="text-base-content/50" />
                      <span className="text-sm">{createdDate.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="font-semibold mb-4">จัดการสถานะ</h3>
                <div className="flex flex-wrap gap-2">
                  {schedule.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus('IN_PROGRESS')}
                        disabled={isUpdating}
                        className="btn btn-info btn-sm"
                      >
                        <Clock size={14} />
                        เริ่มดำเนินการ
                      </button>
                      <button
                        onClick={() => updateStatus('COMPLETED')}
                        disabled={isUpdating}
                        className="btn btn-success btn-sm"
                      >
                        <Check size={14} />
                        ทำเสร็จ
                      </button>
                      <button
                        onClick={convertToActivity}
                        disabled={isUpdating}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} />
                        แปลงเป็นกิจกรรม
                      </button>
                    </>
                  )}
                  
                  {schedule.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => updateStatus('COMPLETED')}
                        disabled={isUpdating}
                        className="btn btn-success btn-sm"
                      >
                        <Check size={14} />
                        ทำเสร็จ
                      </button>
                      <button
                        onClick={convertToActivity}
                        disabled={isUpdating}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} />
                        แปลงเป็นกิจกรรม
                      </button>
                    </>
                  )}

                  {schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus('CANCELLED')}
                      disabled={isUpdating}
                      className="btn btn-error btn-outline btn-sm"
                    >
                      <X size={14} />
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Animal Info */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User size={16} />
                  ข้อมูลสัตว์
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-base-content/70">ชื่อสัตว์</p>
                    <p className="font-medium">{schedule.animal.name}</p>
                  </div>
                  
                  {schedule.animal.animalType && (
                    <div>
                      <p className="text-sm text-base-content/70">ประเภทสัตว์</p>
                      <p className="font-medium">{schedule.animal.animalType.name}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-base-content/70">ฟาร์ม</p>
                    <p className="font-medium">{schedule.animal.farm.name}</p>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => router.push(`/animal/${schedule.animal.id}`)}
                      className="btn btn-primary btn-sm w-full"
                    >
                      ดูข้อมูลสัตว์
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Info */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="font-semibold mb-4">ข้อมูลฟาร์ม</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-base-content/70">ชื่อฟาร์ม</p>
                    <p className="font-medium">{schedule.animal.farm.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-base-content/70">เจ้าของฟาร์ม</p>
                    <p className="font-medium">
                      {schedule.animal.farm.owner.firstName || schedule.animal.farm.owner.lastName
                        ? `${schedule.animal.farm.owner.firstName || ''} ${schedule.animal.farm.owner.lastName || ''}`.trim()
                        : 'ไม่ระบุ'
                      }
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => router.push(`/farm/${schedule.animal.farm.id}/dashboard`)}
                      className="btn btn-outline btn-sm w-full"
                    >
                      ไปที่ฟาร์ม
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </FarmLayout>
  )
}