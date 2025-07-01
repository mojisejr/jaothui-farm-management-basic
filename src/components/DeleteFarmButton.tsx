'use client'

import { useState } from 'react'

interface DeleteFarmButtonProps {
  farmId: string
}

export default function DeleteFarmButton({ farmId }: DeleteFarmButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการลบฟาร์มนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      )
    ) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/farm/${farmId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.href = '/farms?success=ลบฟาร์มสำเร็จแล้ว'
      } else {
        const error = await response.json()
        alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถลบฟาร์มได้'}`)
      }
    } catch (error) {
      console.error('Error deleting farm:', error)
      alert('เกิดข้อผิดพลาดในการลบฟาร์ม')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`btn btn-error btn-sm ${isDeleting ? 'loading' : ''}`}
    >
      {isDeleting ? 'กำลังลบ...' : '🗑️ ลบฟาร์ม'}
    </button>
  )
}
