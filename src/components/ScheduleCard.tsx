'use client'

import { useState } from 'react'
import { Calendar, Clock, Edit, Trash2, Check, X, MoreHorizontal, Repeat, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface Schedule {
  id: string
  title: string
  description: string | null
  notes: string | null
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRecurring: boolean
  recurrenceType: string | null
  createdAt: string
  animal: Animal
}

interface ScheduleCardProps {
  schedule: Schedule
  farmId: string
  onUpdate: () => void
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

const RECURRENCE_LABELS = {
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  quarterly: 'รายไตรมาส',
  yearly: 'รายปี',
}

export function ScheduleCard({ schedule, farmId, onUpdate }: ScheduleCardProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const statusConfig = STATUS_CONFIG[schedule.status]
  const StatusIcon = statusConfig.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const thaiDate = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    const time = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })

    let relativeText = ''
    if (diffDays === 0) {
      relativeText = 'วันนี้'
    } else if (diffDays === 1) {
      relativeText = 'พรุ่งนี้'
    } else if (diffDays === -1) {
      relativeText = 'เมื่อวาน'
    } else if (diffDays > 1) {
      relativeText = `อีก ${diffDays} วัน`
    } else if (diffDays < -1) {
      relativeText = `${Math.abs(diffDays)} วันที่แล้ว`
    }

    return { thaiDate, time, relativeText, diffDays }
  }

  const { thaiDate, time, relativeText, diffDays } = formatDate(schedule.scheduledDate)
  const isOverdue = diffDays < 0 && schedule.status === 'PENDING'
  const isDueToday = diffDays === 0 && schedule.status === 'PENDING'

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('.dropdown, button')) {
      return
    }
    router.push(`/schedule/${schedule.id}`)
  }

  const updateStatus = async (newStatus: Schedule['status']) => {
    if (isUpdating) return

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
        throw new Error('Failed to update schedule')
      }

      toast.success('อัปเดตสถานะเรียบร้อยแล้ว')
      onUpdate()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setIsUpdating(false)
      setShowActions(false)
    }
  }

  const deleteSchedule = async () => {
    if (isUpdating) return
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบกำหนดการนี้?')) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      toast.success('ลบกำหนดการเรียบร้อยแล้ว')
      onUpdate()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('เกิดข้อผิดพลาดในการลบกำหนดการ')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      className={`card bg-base-100 border cursor-pointer ${
        isOverdue
          ? 'border-error/30 bg-error/5'
          : isDueToday
          ? 'border-warning/30 bg-warning/5'
          : 'border-base-200'
      } hover:shadow-md transition-all duration-200`}
    >
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{schedule.title}</h3>
              {schedule.isRecurring && (
                <div className="tooltip" data-tip="กำหนดการซ้ำ">
                  <Repeat size={14} className="text-info" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-base-content/70">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{thaiDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{time}</span>
              </div>
            </div>

            {relativeText && (
              <div className={`text-xs mt-1 ${
                isOverdue ? 'text-error' : isDueToday ? 'text-warning' : 'text-base-content/50'
              }`}>
                {relativeText}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`badge ${statusConfig.color} badge-sm`}>
              <StatusIcon size={12} className="mr-1" />
              {statusConfig.label}
            </div>

            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-xs text-black"
                onClick={() => setShowActions(!showActions)}
              >
                <MoreHorizontal size={14} />
              </label>
              
              {showActions && (
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  {schedule.status === 'PENDING' && (
                    <>
                      <li>
                        <button
                          onClick={() => updateStatus('IN_PROGRESS')}
                          disabled={isUpdating}
                          className={`text-info ${isUpdating ? 'loading loading-xs' : ''}`}
                        >
                          {!isUpdating && <Clock size={14} />}
                          {isUpdating ? 'กำลังอัปเดต...' : 'เริ่มดำเนินการ'}
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => updateStatus('COMPLETED')}
                          disabled={isUpdating}
                          className={`text-success ${isUpdating ? 'loading loading-xs' : ''}`}
                        >
                          {!isUpdating && <Check size={14} />}
                          {isUpdating ? 'กำลังอัปเดต...' : 'ทำเสร็จ'}
                        </button>
                      </li>
                    </>
                  )}
                  
                  {schedule.status === 'IN_PROGRESS' && (
                    <li>
                      <button
                        onClick={() => updateStatus('COMPLETED')}
                        disabled={isUpdating}
                        className={`text-success ${isUpdating ? 'loading loading-xs' : ''}`}
                      >
                        {!isUpdating && <Check size={14} />}
                        {isUpdating ? 'กำลังอัปเดต...' : 'ทำเสร็จ'}
                      </button>
                    </li>
                  )}

                  {schedule.status !== 'CANCELLED' && (
                    <li>
                      <button
                        onClick={() => updateStatus('CANCELLED')}
                        disabled={isUpdating}
                        className={`text-error ${isUpdating ? 'loading loading-xs' : ''}`}
                      >
                        {!isUpdating && <X size={14} />}
                        {isUpdating ? 'กำลังอัปเดต...' : 'ยกเลิก'}
                      </button>
                    </li>
                  )}

                  <div className="divider my-1"></div>
                  
                  <li>
                    <button
                      onClick={() => router.push(`/schedule/edit/${schedule.id}?farmId=${farmId}`)}
                      className="text-primary"
                    >
                      <Edit size={14} />
                      แก้ไข
                    </button>
                  </li>
                  
                  <li>
                    <button
                      onClick={deleteSchedule}
                      disabled={isUpdating}
                      className={`text-error ${isUpdating ? 'loading loading-xs' : ''}`}
                    >
                      {!isUpdating && <Trash2 size={14} />}
                      {isUpdating ? 'กำลังลบ...' : 'ลบ'}
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {schedule.description && (
          <p className="text-sm text-base-content/80 mb-2 line-clamp-2">
            {schedule.description}
          </p>
        )}

        {/* Animal Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-primary/10 text-primary rounded-full w-6 h-6">
                <span className="text-xs">
                  {schedule.animal.animalType?.name.charAt(0) || '?'}
                </span>
              </div>
            </div>
            <span className="text-base-content/70">
              {schedule.animal.name}
              {schedule.animal.animalType && (
                <span className="text-base-content/50 ml-1">
                  ({schedule.animal.animalType.name})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {schedule.isRecurring && schedule.recurrenceType && (
              <div className="badge badge-ghost badge-xs">
                {RECURRENCE_LABELS[schedule.recurrenceType as keyof typeof RECURRENCE_LABELS] || schedule.recurrenceType}
              </div>
            )}
            <ChevronRight className="w-3 h-3 text-base-content/30" />
          </div>
        </div>

        {/* Notes */}
        {schedule.notes && (
          <div className="mt-2 pt-2 border-t border-base-200">
            <p className="text-xs text-base-content/60 line-clamp-2">
              <span className="font-medium">หมายเหตุ:</span> {schedule.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ScheduleCard