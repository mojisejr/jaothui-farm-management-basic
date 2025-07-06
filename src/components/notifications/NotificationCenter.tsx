'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  CheckCheck, 
  Trash2, 
  Bell, 
  Settings,
  RefreshCw,
  Search
} from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import NotificationCard from './NotificationCard'
import GenericEmptyState from '../common/GenericEmptyState'
import NotificationSettings from './NotificationSettings'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

type FilterType = 'all' | 'unread' | 'activity' | 'farm' | 'system'

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
(notification as { farm?: { name?: string } }).farm?.name?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Type filter
    switch (filter) {
      case 'unread':
        return !notification.isRead
      case 'activity':
        return ['ACTIVITY_REMINDER', 'ACTIVITY_OVERDUE', 'ACTIVITY_COMPLETED', 'ACTIVITY_CREATED', 'SCHEDULE_REMINDER'].includes(notification.type)
      case 'farm':
        return ['FARM_INVITATION', 'MEMBER_JOINED'].includes(notification.type)
      case 'system':
        return notification.type === 'SYSTEM_ANNOUNCEMENT'
      default:
        return true
    }
  })

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setIsActionsOpen(false)
  }

  const handleClearAll = async () => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนทั้งหมด?')) {
      await clearAllNotifications()
      setIsActionsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-base-100 w-full max-w-md h-full shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-base-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
                {unreadCount > 0 && (
                  <span className="badge badge-primary badge-sm">{unreadCount}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Connection Status */}
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`} />
                
                {/* Actions Dropdown */}
                <div className="dropdown dropdown-end">
                  <label
                    tabIndex={0}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                  >
                    <Settings size={16} />
                  </label>
                  
                  {isActionsOpen && (
                    <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-10">
                      <li>
                        <button
                          onClick={refreshNotifications}
                          className="text-sm"
                        >
                          <RefreshCw size={14} />
                          รีเฟรช
                        </button>
                      </li>
                      
                      <li>
                        <button
                          onClick={() => {
                            setIsSettingsOpen(true)
                            setIsActionsOpen(false)
                          }}
                          className="text-sm"
                        >
                          <Settings size={14} />
                          ตั้งค่า
                        </button>
                      </li>
                      
                      {unreadCount > 0 && (
                        <li>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm"
                          >
                            <CheckCheck size={14} />
                            อ่านทั้งหมด
                          </button>
                        </li>
                      )}
                      
                      {notifications.length > 0 && (
                        <li>
                          <button
                            onClick={handleClearAll}
                            className="text-sm text-error"
                          >
                            <Trash2 size={14} />
                            ลบทั้งหมด
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="btn btn-ghost btn-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="ค้นหาการแจ้งเตือน..."
                className="input input-bordered input-sm w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'unread', label: 'ยังไม่อ่าน' },
                { key: 'activity', label: 'กิจกรรม' },
                { key: 'farm', label: 'ฟาร์ม' },
                { key: 'system', label: 'ระบบ' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={`btn btn-xs ${
                    filter === key ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <GenericEmptyState
                icon={<Bell className="w-12 h-12" />}
                title={searchTerm || filter !== 'all' ? 'ไม่พบการแจ้งเตือน' : 'ไม่มีการแจ้งเตือน'}
                description={
                  searchTerm 
                    ? 'ลองค้นหาด้วยคำอื่น'
                    : filter !== 'all' 
                    ? 'ลองเปลี่ยนตัวกรอง'
                    : 'คุณจะได้รับการแจ้งเตือนเมื่อมีกิจกรรมใหม่'
                }
              />
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <motion.div key={notification.id}>
                      <NotificationCard
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-base-200 text-center">
              <p className="text-xs text-base-content/50">
                {filteredNotifications.length} จาก {notifications.length} การแจ้งเตือน
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </AnimatePresence>
  )
}

export default NotificationCenter