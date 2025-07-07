'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react'

interface Invitation {
  id: string
  token: string
  phoneNumber: string
  createdAt: string
  expiresAt: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  farm: {
    id: string
    name: string
  }
  inviter: {
    firstName: string
    lastName: string
  }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations/')
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }
      const data = await response.json()
      setInvitations(data.invitations)
    } catch (err) {
      setError('ไม่สามารถโหลดคำเชิญได้')
      console.error('Error fetching invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (token: string, action: 'accept' | 'decline') => {
    setActionLoading(token)
    try {
      const response = await fetch(`/api/invitations/${token}/${action}`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (response.ok) {
        if (action === 'accept' && data.farm?.id) {
          router.push(`/farm/${data.farm.id}/dashboard`)
        } else {
          fetchInvitations()
        }
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Error handling invitation:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">คำเชิญเข้าร่วมฟาร์ม</h1>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {invitations.length === 0 ? (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <Clock className="w-12 h-12 text-base-content/50 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">ไม่มีคำเชิญที่รอดำเนินการ</h2>
                <p className="text-base-content/70">
                  เมื่อมีคำเชิญเข้าร่วมฟาร์ม คุณจะเห็นรายการที่นี่
                </p>
                <div className="card-actions justify-center mt-4">
                  <button 
                    onClick={() => router.push('/farms')}
                    className="btn btn-primary"
                  >
                    ดูฟาร์มทั้งหมด
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="card bg-base-200 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {invitation.farm.name}
                        </h3>
                        <p className="text-sm text-base-content/70 mb-2">
                          เชิญโดย: {invitation.inviter.firstName} {invitation.inviter.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <Clock className="w-4 h-4" />
                          <span>
                            หมดอายุ: {new Date(invitation.expiresAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => handleAction(invitation.token, 'decline')}
                        className="btn btn-outline btn-error btn-sm gap-2"
                        disabled={actionLoading === invitation.token}
                      >
                        {actionLoading === invitation.token ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        ปฏิเสธ
                      </button>
                      <button
                        onClick={() => handleAction(invitation.token, 'accept')}
                        className="btn btn-primary btn-sm gap-2"
                        disabled={actionLoading === invitation.token}
                      >
                        {actionLoading === invitation.token ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        ยอมรับ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}