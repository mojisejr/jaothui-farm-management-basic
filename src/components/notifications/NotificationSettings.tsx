'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  Save,
  Settings,
  Moon,
  Sun as _Sun,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import PushNotificationManager from '@/lib/push-notifications'

interface NotificationPreferences {
  activityReminders: boolean
  overdueAlerts: boolean
  farmInvitations: boolean
  memberJoined: boolean
  newActivities: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  reminderFrequency: number
  quietStart?: string
  quietEnd?: string
}

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({
  isOpen,
  onClose,
}: NotificationSettingsProps) {
  const { user } = useAuth()
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pushManager] = useState(() => PushNotificationManager.getInstance())

  // Fetch preferences on mount
  useEffect(() => {
    if (isOpen && user) {
      fetchPreferences()
    }
  }, [isOpen, user])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications/preferences')

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences)
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error)
      toast.error('ไม่สามารถโหลดการตั้งค่าแจ้งเตือนได้')
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const data = await response.json()
      toast.success(data.message || 'บันทึกการตั้งค่าเรียบร้อยแล้ว')
      setPreferences(data.preferences)
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: unknown,
  ) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: value,
    })
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (!pushManager.isSupported()) {
      toast.error('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบ Push')
      return
    }

    try {
      if (enabled) {
        const result = await pushManager.initialize()
        if (result.success) {
          updatePreference('pushEnabled', true)
          toast.success('เปิดใช้งานการแจ้งเตือนแบบ Push แล้ว')

          // Show test notification
          setTimeout(() => {
            pushManager.showTestNotification().catch(console.error)
          }, 1000)
        } else {
          toast.error('ไม่สามารถเปิดใช้งานการแจ้งเตือนได้')
        }
      } else {
        const success = await pushManager.disable()
        if (success) {
          updatePreference('pushEnabled', false)
          toast.success('ปิดการแจ้งเตือนแบบ Push แล้ว')
        } else {
          toast.error('ไม่สามารถปิดการแจ้งเตือนได้')
        }
      }
    } catch (error) {
      console.error('Push notification toggle error:', error)
      toast.error('เกิดข้อผิดพลาดในการตั้งค่าการแจ้งเตือน')
    }
  }

  const reminderOptions = [
    { value: 5, label: '5 นาที' },
    { value: 15, label: '15 นาที' },
    { value: 30, label: '30 นาที' },
    { value: 60, label: '1 ชั่วโมง' },
    { value: 120, label: '2 ชั่วโมง' },
    { value: 1440, label: '1 วัน' },
  ]

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-base-100 w-full max-w-md rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-200 bg-base-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-base-content">
                ตั้งค่าการแจ้งเตือน
              </h2>
            </div>
            <button onClick={onClose} className="btn btn-warn btn-sm">
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : preferences ? (
            <div className="space-y-6">
              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  ประเภทการแจ้งเตือน
                </h3>
                <div className="space-y-3">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">เตือนกิจกรรม</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.activityReminders}
                        onChange={(e) =>
                          updatePreference(
                            'activityReminders',
                            e.target.checked,
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">แจ้งเตือนเกินกำหนด</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.overdueAlerts}
                        onChange={(e) =>
                          updatePreference('overdueAlerts', e.target.checked)
                        }
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">เชิญเข้าร่วมฟาร์ม</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.farmInvitations}
                        onChange={(e) =>
                          updatePreference('farmInvitations', e.target.checked)
                        }
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">สมาชิกใหม่เข้าร่วม</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.memberJoined}
                        onChange={(e) =>
                          updatePreference('memberJoined', e.target.checked)
                        }
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">กิจกรรมใหม่</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.newActivities}
                        onChange={(e) =>
                          updatePreference('newActivities', e.target.checked)
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Reminder Frequency */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  ความถี่ในการเตือน
                </h3>
                <select
                  className="select select-bordered w-full"
                  value={preferences.reminderFrequency}
                  onChange={(e) =>
                    updatePreference(
                      'reminderFrequency',
                      parseInt(e.target.value),
                    )
                  }
                >
                  {reminderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quiet Hours */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-3 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  ช่วงเวลาเงียบ
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text text-xs">เริ่ม</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={preferences.quietStart || ''}
                      onChange={(e) =>
                        updatePreference('quietStart', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-xs">สิ้นสุด</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={preferences.quietEnd || ''}
                      onChange={(e) =>
                        updatePreference('quietEnd', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Methods */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-3 flex items-center gap-2">
                  {preferences.pushEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  วิธีการแจ้งเตือน
                </h3>
                <div className="space-y-3">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">
                        Push Notification
                        {!pushManager.isSupported() && (
                          <span className="text-xs text-error ml-1">
                            (ไม่รองรับ)
                          </span>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={preferences.pushEnabled}
                        disabled={!pushManager.isSupported()}
                        onChange={(e) => handlePushToggle(e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">
                        อีเมล (ยังไม่พร้อมใช้งาน)
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={false}
                        disabled
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-base-content/60">ไม่สามารถโหลดการตั้งค่าได้</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {preferences && (
          <div className="p-4 border-t border-base-200 bg-base-50">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="btn btn-ghost flex-1 text-black"
                disabled={isSaving}
              >
                ยกเลิก
              </button>
              <button
                onClick={savePreferences}
                className="btn btn-primary flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default NotificationSettings
