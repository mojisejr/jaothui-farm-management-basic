'use client'

import { Bell, BellRing } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/contexts/NotificationContext'

interface NotificationBadgeProps {
  onClick: () => void
  className?: string
}

export function NotificationBadge({ onClick, className = '' }: NotificationBadgeProps) {
  const { unreadCount, isConnected } = useNotifications()

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative btn btn-ghost btn-circle ${className}`}
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      {/* Notification Icon */}
      <motion.div
        animate={unreadCount > 0 ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
      >
        {unreadCount > 0 ? (
          <BellRing size={20} className="text-primary" />
        ) : (
          <Bell size={20} className="text-base-content/70" />
        )}
      </motion.div>

      {/* Unread Count Badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 -right-1 bg-error text-error-content rounded-full text-xs font-bold min-w-[20px] h-5 flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100 ${
          isConnected ? 'bg-success' : 'bg-warning'
        }`}
        title={isConnected ? 'Connected to notifications' : 'Connecting...'}
      />
    </motion.button>
  )
}

export default NotificationBadge