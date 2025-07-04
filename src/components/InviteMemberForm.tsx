'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'

interface InviteMemberFormProps {
  farmId: string
}

export default function InviteMemberForm({ farmId }: InviteMemberFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  // Thai phone number validation
  const validateThaiPhoneNumber = (phone: string): boolean => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')

    // Check if it's a valid Thai phone number
    // Must be 10 digits starting with 06, 08, 09 for mobile
    // or 02, 03, 04, 05, 07 for landline (but we focus on mobile)
    const mobilePattern = /^0[689]\d{8}$/
    return mobilePattern.test(cleaned)
  }

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 10) {
      setPhoneNumber(formatPhoneNumber(cleaned))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedPhone = phoneNumber.replace(/\D/g, '')

    if (!validateThaiPhoneNumber(cleanedPhone)) {
      setMessage('กรุณากรอกเบอร์โทรศัพท์มือถือที่ถูกต้อง (10 หลัก)')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/farm/${farmId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('ส่งคำเชิญเรียบร้อยแล้ว')
        setMessageType('success')
        setPhoneNumber('')
        // Refresh the page to update member list
        router.refresh()
      } else {
        setMessage(data.error || 'เกิดข้อผิดพลาดในการส่งคำเชิญ')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label" htmlFor="phoneNumber">
          <span className="label-text">เบอร์โทรศัพท์มือถือ</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="081-234-5678"
            className="input input-bordered w-full pl-12"
            disabled={isLoading}
            required
          />
          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="label">
          <span className="label-text-alt text-gray-500">
            กรอกเบอร์โทรศัพท์มือถือ 10 หลัก (เช่น 081-234-5678)
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          <span>{message}</span>
        </div>
      )}

      <div className="form-control">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังส่งคำเชิญ...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              ส่งคำเชิญ
            </>
          )}
        </button>
      </div>
    </form>
  )
}
