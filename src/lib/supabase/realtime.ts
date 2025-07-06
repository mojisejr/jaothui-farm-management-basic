import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './client'

// Realtime subscription types
export interface RealtimeSubscriptionOptions {
  userId: string
  farmId?: string
}

export interface NotificationRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Record<string, unknown>
  old_record?: Record<string, unknown>
}

export type NotificationCallback = (event: NotificationRealtimeEvent) => void

class RealtimeNotificationManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map()
  private isConnected = false

  // Subscribe to user notifications
  subscribeToUserNotifications(
    userId: string, 
    callback: NotificationCallback
  ) {
    const channelName = `user_notifications_${userId}`
    
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'notifications',
            record: payload.new,
            old_record: payload.old,
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to user notifications: ${userId}`)
          this.isConnected = true
        } else if (status === 'CLOSED') {
          console.log(`❌ Notification subscription closed: ${userId}`)
          this.isConnected = false
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`🔥 Notification subscription error: ${userId}`)
          this.isConnected = false
        }
      })

    this.subscriptions.set(channelName, channel)
    return channelName
  }

  // Subscribe to farm-related notifications (activities, schedules, etc.)
  subscribeToFarmNotifications(
    userId: string,
    farmId: string,
    callback: NotificationCallback
  ) {
    const channelName = `farm_notifications_${farmId}_${userId}`
    
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `farm_id=eq.${farmId}`,
        },
        (payload) => {
          // Only notify if it's for this user or a farm-wide notification
          if ((payload.new as Record<string, unknown>)?.user_id === userId || !(payload.new as Record<string, unknown>)?.user_id) {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'notifications',
              record: payload.new,
              old_record: payload.old,
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to farm notifications: ${farmId}`)
        } else if (status === 'CLOSED') {
          console.log(`❌ Farm notification subscription closed: ${farmId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`🔥 Farm notification subscription error: ${farmId}`)
        }
      })

    this.subscriptions.set(channelName, channel)
    return channelName
  }

  // Subscribe to activity and schedule changes
  subscribeToActivityUpdates(
    farmId: string,
    callback: NotificationCallback
  ) {
    const activityChannelName = `activities_${farmId}`
    const scheduleChannelName = `schedules_${farmId}`

    // Activities subscription
    if (!this.subscriptions.has(activityChannelName)) {
      const activityChannel = supabase
        .channel(activityChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
            filter: `farm_id=eq.${farmId}`,
          },
          (payload) => {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'activities',
              record: payload.new,
              old_record: payload.old,
            })
          }
        )
        .subscribe()

      this.subscriptions.set(activityChannelName, activityChannel)
    }

    // Schedules subscription  
    if (!this.subscriptions.has(scheduleChannelName)) {
      const scheduleChannel = supabase
        .channel(scheduleChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activity_schedules',
            filter: `farm_id=eq.${farmId}`,
          },
          (payload) => {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'activity_schedules',
              record: payload.new,
              old_record: payload.old,
            })
          }
        )
        .subscribe()

      this.subscriptions.set(scheduleChannelName, scheduleChannel)
    }

    return [activityChannelName, scheduleChannelName]
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(channelName)
      console.log(`🔇 Unsubscribed from: ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      this.unsubscribe(channelName)
    })
    this.isConnected = false
    console.log('🔇 Unsubscribed from all notification channels')
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      subscriptionCount: this.subscriptions.size,
    }
  }

  // Reconnect all subscriptions (useful for recovery)
  async reconnectAll() {
    const activeChannels = Array.from(this.subscriptions.keys())
    console.log(`🔄 Reconnecting ${activeChannels.length} notification channels...`)
    
    // Note: In a real implementation, you'd want to store the subscription parameters
    // and resubscribe with the same parameters. For now, we'll just clear and let
    // the components resubscribe.
    this.unsubscribeAll()
  }
}

// Export singleton instance
export const realtimeNotificationManager = new RealtimeNotificationManager()

// Utility function to check if user is online/offline
export const monitorConnectionStatus = (callback: (isOnline: boolean) => void) => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Initial status
  callback(navigator.onLine)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Helper to format notification data for real-time events
export const formatRealtimeNotification = (event: NotificationRealtimeEvent) => {
  const { record } = event
  
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    message: record.message,
    data: record.data,
    isRead: record.is_read,
    priority: record.priority,
    createdAt: record.created_at,
    farmId: record.farm_id,
    relatedEntityType: record.related_entity_type,
    relatedEntityId: record.related_entity_id,
  }
}