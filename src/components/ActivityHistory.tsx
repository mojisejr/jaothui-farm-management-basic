'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter,
} from 'lucide-react'

interface Activity {
  id: string
  title: string
  description: string | null
  notes: string | null
  activityDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

interface ActivitySchedule {
  id: string
  title: string
  description: string | null
  notes: string | null
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRecurring: boolean
  recurrenceType: string | null
  createdAt: string
  updatedAt: string
}

interface ActivityHistoryProps {
  animalId: string
  animalName: string
  activities?: Activity[]
  schedules?: ActivitySchedule[]
  showAddButton?: boolean
  maxItems?: number
}

export function ActivityHistory({
  animalId,
  animalName,
  activities = [],
  schedules = [],
  showAddButton = true,
  maxItems = 10,
}: ActivityHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'scheduled'>('all')

  // Combine and sort all activities
  const allItems = [
    ...activities.map(item => ({ ...item, type: 'activity' as const })),
    ...schedules.map(item => ({ 
      ...item, 
      type: 'schedule' as const,
      activityDate: item.scheduledDate 
    })),
  ].sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())

  // Filter items
  const filteredItems = allItems.filter(item => {
    switch (filter) {
      case 'completed':
        return item.status === 'COMPLETED'
      case 'pending':
        return item.status === 'PENDING' || item.status === 'IN_PROGRESS'
      case 'scheduled':
        return item.type === 'schedule' && item.status === 'PENDING'
      default:
        return true
    }
  })

  const displayItems = showAll ? filteredItems : filteredItems.slice(0, maxItems)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-success" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-error" />
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-warning" />
      default:
        return <AlertCircle className="w-4 h-4 text-info" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success'
      case 'CANCELLED':
        return 'badge-error'
      case 'IN_PROGRESS':
        return 'badge-warning'
      default:
        return 'badge-info'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'เสร็จสิ้น'
      case 'CANCELLED':
        return 'ยกเลิก'
      case 'IN_PROGRESS':
        return 'กำลังดำเนินการ'
      default:
        return 'รอดำเนินการ'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const buddhistYear = date.getFullYear() + 543
    const month = date.toLocaleDateString('th-TH', { month: 'short' })
    const day = date.getDate()
    const time = date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    return `${day} ${month} ${buddhistYear} เวลา ${time}`
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          ประวัติกิจกรรม
        </h3>
        
        {showAddButton && (
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => window.location.href = `/activity/create?animalId=${animalId}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มกิจกรรม
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => window.location.href = `/schedule/create?animalId=${animalId}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มกำหนดการ
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      {allItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-base-content/60" />
          <div className="btn-group">
            <button
              className={`btn btn-xs ${filter === 'all' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
            >
              ทั้งหมด ({allItems.length})
            </button>
            <button
              className={`btn btn-xs ${filter === 'completed' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setFilter('completed')}
            >
              เสร็จแล้ว ({allItems.filter(i => i.status === 'COMPLETED').length})
            </button>
            <button
              className={`btn btn-xs ${filter === 'pending' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setFilter('pending')}
            >
              รอดำเนินการ ({allItems.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length})
            </button>
            <button
              className={`btn btn-xs ${filter === 'scheduled' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setFilter('scheduled')}
            >
              กำหนดการ ({schedules.filter(s => s.status === 'PENDING').length})
            </button>
          </div>
        </div>
      )}

      {/* Activity List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>
            {filter === 'all' 
              ? `ยังไม่มีกิจกรรมสำหรับ ${animalName}`
              : 'ไม่พบกิจกรรมที่ตรงกับตัวกรอง'
            }
          </p>
          {showAddButton && filter === 'all' && (
            <div className="flex gap-2 justify-center mt-3">
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => window.location.href = `/activity/create?animalId=${animalId}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มกิจกรรมแรก
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => window.location.href = `/schedule/create?animalId=${animalId}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                สร้างกำหนดการ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`card bg-base-100 border border-base-300 cursor-pointer hover:shadow-md transition-shadow ${
                  isUpcoming(item.activityDate) ? 'border-primary/20 bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (item.type === 'schedule') {
                    window.location.href = `/schedule/${item.id}`
                  } else {
                    window.location.href = `/activity/${item.id}`
                  }
                }}
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(item.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.type === 'schedule' && (
                              <div className="badge badge-xs badge-secondary">
                                {isUpcoming(item.activityDate) ? 'กำหนดการ' : 'ผ่านมาแล้ว'}
                              </div>
                            )}
                            {item.type === 'schedule' && item.isRecurring && (
                              <div className="badge badge-xs badge-accent">
                                ซ้ำ
                              </div>
                            )}
                            <div className={`badge badge-xs ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </div>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-xs text-base-content/70 mt-1">
                            {item.description}
                          </p>
                        )}
                        
                        {item.notes && (
                          <p className="text-xs text-base-content/60 mt-1 italic">
                            หมายเหตุ: {item.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.activityDate)}
                          </div>
                          
                          {item.type === 'schedule' && item.recurrenceType && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.recurrenceType}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Show More/Less Button */}
          {filteredItems.length > maxItems && (
            <button
              className="btn btn-sm btn-ghost w-full text-black"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  แสดงน้อยลง
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  แสดงเพิ่มเติม ({filteredItems.length - maxItems} รายการ)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}