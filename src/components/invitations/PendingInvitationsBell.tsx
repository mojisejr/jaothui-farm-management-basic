'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PendingInvitationsBell() {
  const [count, setCount] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/invitations/index', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCount(data.invitations?.length ?? 0)
        }
      } catch {
        // ignore
      }
    }
    fetchCount()
  }, [])

  if (count === 0) return null

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => router.push('/profile') /* route to list */}
    >
      <Bell className="w-6 h-6 text-white" />
      <span className="badge badge-error badge-xs absolute -top-1 -right-1">
        {count}
      </span>
    </div>
  )
}
