// Push notification utilities for web browsers
export class PushNotificationManager {
  private static instance: PushNotificationManager
  private swRegistration: ServiceWorkerRegistration | null = null
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied'
    return Notification.permission
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported')
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration)
      this.swRegistration = registration
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.registerServiceWorker()
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker not registered')
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      console.log('Push subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        const result = await subscription.unsubscribe()
        console.log('Push subscription removed:', result)
        return result
      }
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Get current push subscription
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      return null
    }

    try {
      return await this.swRegistration.pushManager.getSubscription()
    } catch (error) {
      console.error('Failed to get current subscription:', error)
      return null
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }

      console.log('Subscription sent to server successfully')
      return true
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
      return false
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }

      console.log('Subscription removed from server successfully')
      return true
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
      return false
    }
  }

  // Initialize push notifications (complete flow)
  async initialize(): Promise<{ success: boolean; subscription?: PushSubscription }> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported')
      }

      // Request permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permission not granted')
      }

      // Register service worker
      await this.registerServiceWorker()

      // Subscribe to push notifications
      const subscription = await this.subscribeToPush()
      if (!subscription) {
        throw new Error('Failed to create subscription')
      }

      // Send subscription to server
      const serverSuccess = await this.sendSubscriptionToServer(subscription)
      if (!serverSuccess) {
        throw new Error('Failed to register subscription with server')
      }

      return { success: true, subscription }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return { success: false }
    }
  }

  // Disable push notifications (complete flow)
  async disable(): Promise<boolean> {
    try {
      // Remove subscription from server
      await this.removeSubscriptionFromServer()

      // Unsubscribe from push notifications
      const unsubscribed = await this.unsubscribeFromPush()

      return unsubscribed
    } catch (error) {
      console.error('Failed to disable push notifications:', error)
      return false
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Show a test notification
  async showTestNotification(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported')
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    new Notification('JAOTHUI Farm Management', {
      body: 'การแจ้งเตือนถูกเปิดใช้งานแล้ว',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
    })
  }
}

export default PushNotificationManager