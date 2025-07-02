'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  farmId: string
}

export default function AddMemberButton({ farmId }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAddMember = async () => {
    const phone = prompt('กรุณากรอกเบอร์โทรศัพท์ของสมาชิกใหม่')
    if (!phone) return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/farm/${farmId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'เพิ่มสมาชิกสำเร็จ')
        window.location.reload()
      } else {
        toast.error(data.error || 'ไม่สามารถเพิ่มสมาชิกได้')
      }
    } catch (_e) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className={`btn btn-outline w-full justify-start ${isLoading ? 'loading' : ''}`}
      onClick={handleAddMember}
      disabled={isLoading}
      type="button"
    >
      📞 เพิ่มสมาชิกด้วยเบอร์โทร
    </button>
  )
}
