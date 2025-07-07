'use client'

import { useEffect, useState } from 'react'

export default function PendingInvitationsBell() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/invitations', { cache: 'no-store' })
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

  // This component now only fetches data but doesn't render UI
  // The count is used by the main notification system
  return null
}
