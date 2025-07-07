'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  Info, 
  Users, 
  Calendar,
  Check,
  Trash2,
  MoreVertical,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: 'ACTIVITY_REMINDER' | 'ACTIVITY_OVERDUE' | 'SCHEDULE_REMINDER' | 'FARM_INVITATION' | 'MEMBER_JOINED' | 'ACTIVITY_COMPLETED' | 'ACTIVITY_CREATED' | 'SYSTEM_ANNOUNCEMENT'
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  farmId?: string
  farm?: { id: string; name: string }
  relatedEntityType?: string
  relatedEntityId?: string
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  compact?: boolean
}

const NOTIFICATION_CONFIG = {
  ACTIVITY_REMINDER: {
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  ACTIVITY_OVERDUE: {
    icon: AlertTriangle,
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
  },
  SCHEDULE_REMINDER: {
    icon: Calendar,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
  FARM_INVITATION: {
    icon: Users,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
  },
  MEMBER_JOINED: {
    icon: Users,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  ACTIVITY_COMPLETED: {
    icon: Check,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  ACTIVITY_CREATED: {
    icon: Bell,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  SYSTEM_ANNOUNCEMENT: {
    icon: Info,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
}

const PRIORITY_CONFIG = {
  URGENT: { ring: 'ring-2 ring-error', pulse: true },
  HIGH: { ring: 'ring-1 ring-warning', pulse: false },
  NORMAL: { ring: '', pulse: false },
  LOW: { ring: '', pulse: false },
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  compact = false 
}: NotificationCardProps) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const config = NOTIFICATION_CONFIG[notification.type]
  const priorityConfig = PRIORITY_CONFIG[notification.priority]
  const Icon = config.icon

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: th,
  })

  const handleMarkAsRead = async () => {
    if (notification.isRead || isLoading) return
    
    setIsLoading(true)
    try {
      await onMarkAsRead(notification.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await onDelete(notification.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigate = () => {
    // Navigate to related entity if available
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const { relatedEntityType, relatedEntityId } = notification
      
      if (relatedEntityType === 'activity') {
        router.push(`/activity/${relatedEntityId}`)
      } else if (relatedEntityType === 'schedule') {
        router.push(`/schedule/${relatedEntityId}`)
      } else if (relatedEntityType === 'animal') {
        router.push(`/animal/${relatedEntityId}`)
      } else if (relatedEntityType === 'farm' && notification.farmId) {
        router.push(`/farm/${notification.farmId}/dashboard`)
      }
    } else if (notification.farmId) {
      router.push(`/farm/${notification.farmId}/dashboard`)
    }

    // Mark as read when navigating
    if (!notification.isRead) {
      handleMarkAsRead()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        relative group border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer
        ${notification.isRead ? 'bg-base-100' : 'bg-base-50'}
        ${config.borderColor}
        ${priorityConfig.ring}
        ${priorityConfig.pulse ? 'animate-pulse' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={handleNavigate}
    >
      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-full ${config.bgColor} ${config.color} flex-shrink-0`}>
          <Icon size={compact ? 16 : 20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${notification.isRead ? 'text-base-content/70' : 'text-base-content'}`}>
              {notification.title}
            </h4>
            
            <div className="flex items-center gap-1">
              {/* Priority Badge */}
              {notification.priority !== 'NORMAL' && (
                <div className={`
                  badge badge-xs
                  ${notification.priority === 'URGENT' ? 'badge-error' : ''}
                  ${notification.priority === 'HIGH' ? 'badge-warning' : ''}
                  ${notification.priority === 'LOW' ? 'badge-ghost' : ''}
                `}>
                  {notification.priority}
                </div>
              )}

              {/* Actions Dropdown */}
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions(!showActions)
                  }}
                >
                  <MoreVertical size={12} />
                </label>
                
                {showActions && (
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-10"
                  >
                    {!notification.isRead && (
                      <li>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead()
                            setShowActions(false)
                          }}
                          disabled={isLoading}
                          className={`text-sm ${isLoading ? 'loading loading-xs' : ''}`}
                        >
                          {!isLoading && <Check size={14} />}
                          {isLoading ? 'กำลังอัปเดต...' : 'อ่านแล้ว'}
                        </button>
                      </li>
                    )}
                    
                    {(notification.relatedEntityType && notification.relatedEntityId) && (
                      <li>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigate()
                            setShowActions(false)
                          }}
                          className="text-sm"
                        >
                          <ExternalLink size={14} />
                          ดูรายละเอียด
                        </button>
                      </li>
                    )}
                    
                    <li>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete()
                          setShowActions(false)
                        }}
                        disabled={isLoading}
                        className={`text-sm text-error ${isLoading ? 'loading loading-xs' : ''}`}
                      >
                        {!isLoading && <Trash2 size={14} />}
                        {isLoading ? 'กำลังลบ...' : 'ลบ'}
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <p className={`${compact ? 'text-xs' : 'text-sm'} ${notification.isRead ? 'text-base-content/60' : 'text-base-content/80'} line-clamp-2 mb-2`}>
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-base-content/50">
            <div className="flex items-center gap-2">
              <span>{timeAgo}</span>
              {notification.farm && (
                <>
                  <span>•</span>
                  <span>{notification.farm.name}</span>
                </>
              )}
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <span className="text-primary font-medium">ใหม่</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-base-100/50 rounded-lg flex items-center justify-center">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
    </motion.div>
  )
}

export default NotificationCard