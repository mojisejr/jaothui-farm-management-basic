'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { realtimeNotificationManager, formatRealtimeNotification } from '@/lib/supabase/realtime'

// Notification types
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
  relatedEntityType?: string
  relatedEntityId?: string
}

interface NotificationContextType {
  // State
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isConnected: boolean

  // Actions
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  refreshNotifications: () => void

  // Settings
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  showToasts: boolean
  setShowToasts: (enabled: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showToasts, setShowToasts] = useState(true)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('🔔 [Notifications] No user ID, skipping fetch')
      return
    }

    try {
      console.log('🔔 [Notifications] Fetching notifications for user:', user.id)
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 [Notifications] Fetched data:', {
          total: data.notifications?.length || 0,
          unread: data.notifications?.filter((n: Notification) => !n.isRead).length || 0,
          types: data.notifications?.map((n: Notification) => n.type) || []
        })
        setNotifications(data.notifications || [])
      } else {
        console.error('🔔 [Notifications] Fetch failed:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('🔔 [Notifications] Error response:', errorData)
      }
    } catch (error) {
      console.error('🔔 [Notifications] Fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user?.id) {
      console.log('🔔 [Realtime] No user ID, skipping subscription')
      return
    }

    console.log('🔔 [Realtime] Setting up subscription for user:', user.id)
    // Subscribe to user notifications
    const subscriptionId = realtimeNotificationManager.subscribeToUserNotifications(
      user.id,
      (event) => {
        console.log('🔔 [Realtime] Received event:', event.type, event)
        const notification = formatRealtimeNotification(event) as Notification
        
        if (event.type === 'INSERT') {
          // New notification
          console.log('🔔 [Realtime] Adding new notification:', notification.title)
          setNotifications(prev => [notification, ...prev])
          
          // Show toast if enabled
          if (showToasts) {
            const toastConfig = getToastConfig(notification)
            toast[toastConfig.type](notification.title, {
              description: notification.message,
              duration: toastConfig.duration,
            })
          }
          
          // Play sound if enabled
          if (soundEnabled) {
            playNotificationSound(notification.priority)
          }
        } else if (event.type === 'UPDATE') {
          // Updated notification
          setNotifications(prev =>
            prev.map(n => n.id === notification.id ? notification : n)
          )
        } else if (event.type === 'DELETE') {
          // Deleted notification
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }
      }
    )

    // Update connection status
    const statusCheck = setInterval(() => {
      const status = realtimeNotificationManager.getConnectionStatus()
      setIsConnected(status.isConnected)
    }, 5000)

    return () => {
      realtimeNotificationManager.unsubscribe(subscriptionId)
      clearInterval(statusCheck)
    }
  }, [user?.id, showToasts, soundEnabled])

  // Initial data fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications([])
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    soundEnabled,
    setSoundEnabled,
    showToasts,
    setShowToasts,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Helper functions
function getToastConfig(notification: Notification) {
  switch (notification.priority) {
    case 'URGENT':
      return { type: 'error' as const, duration: 8000 }
    case 'HIGH':
      return { type: 'warning' as const, duration: 6000 }
    case 'NORMAL':
      return { type: 'info' as const, duration: 4000 }
    case 'LOW':
      return { type: 'success' as const, duration: 3000 }
    default:
      return { type: 'info' as const, duration: 4000 }
  }
}

function playNotificationSound(priority: string) {
  // Create audio context for notification sounds
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Different frequencies for different priorities
    const frequencies = {
      URGENT: 800,
      HIGH: 600,
      NORMAL: 400,
      LOW: 300,
    }

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(
      frequencies[priority as keyof typeof frequencies] || 400,
      audioContext.currentTime
    )
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (_error) {
    // Notification sound failed silently
  }
}