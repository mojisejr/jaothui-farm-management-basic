'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
}

export default function InvitationActions({ token }: Props) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (action: 'accept' | 'decline') => {
    setLoading(action)
    setMessage(null)
    try {
      const res = await fetch(`/api/invitations/${token}/${action}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message || 'สำเร็จ')
        // Refresh to update state (e.g., show success message only)
        router.refresh()
      } else {
        setMessage(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (_error) {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <div className="alert alert-info">
          <span>{message}</span>
        </div>
      )}
      <button
        onClick={() => handleAction('accept')}
        className="btn btn-primary gap-2"
        disabled={loading !== null}
      >
        {loading === 'accept' && <span className="loading loading-spinner" />}
        <CheckCircle2 className="w-4 h-4" /> ยอมรับคำเชิญ
      </button>
      <button
        onClick={() => handleAction('decline')}
        className="btn btn-outline btn-error gap-2"
        disabled={loading !== null}
      >
        {loading === 'decline' && <span className="loading loading-spinner" />}
        <XCircle className="w-4 h-4" /> ปฏิเสธคำเชิญ
      </button>
    </div>
  )
}
