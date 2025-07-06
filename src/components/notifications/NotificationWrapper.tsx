'use client'

import { useState } from 'react'
import NotificationBadge from './NotificationBadge'
import NotificationCenter from './NotificationCenter'

interface NotificationWrapperProps {
  className?: string
}

export function NotificationWrapper({ className = '' }: NotificationWrapperProps) {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  return (
    <>
      <NotificationBadge
        onClick={() => setIsNotificationCenterOpen(true)}
        className={className}
      />
      
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  )
}

export default NotificationWrapper