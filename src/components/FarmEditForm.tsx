'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { THAI_PROVINCES, CROP_TYPES } from '@/types/farm'

interface FarmDetail {
  id: string
  name: string
  province: string
  size: number | null
  cropTypes: string[]
  description: string | null
}

interface FarmEditFormProps {
  farm: FarmDetail
}

export default function FarmEditForm({ farm }: FarmEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: farm.name,
    province: farm.province,
    size: farm.size?.toString() || '',
    cropTypes: farm.cropTypes,
    description: farm.description || '',
  })

  const handleCropTypeChange = (crop: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      cropTypes: checked
        ? [...prev.cropTypes, crop]
        : prev.cropTypes.filter((c) => c !== crop),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const submitData = {
        name: formData.name,
        province: formData.province,
        size: formData.size ? parseFloat(formData.size) : null,
        cropTypes: formData.cropTypes,
        description: formData.description || null,
      }

      const response = await fetch(`/api/farm/${farm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push(`/farm/${farm.id}?success=อัปเดตฟาร์มสำเร็จแล้ว`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'เกิดข้อผิดพลาดในการอัปเดตฟาร์ม')
      }
    } catch (error) {
      console.error('Error updating farm:', error)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Farm Name */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">ชื่อฟาร์ม *</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="input input-bordered w-full"
          placeholder="ระบุชื่อฟาร์มของคุณ"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Province */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">จังหวัด *</span>
        </label>
        <select
          value={formData.province}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, province: e.target.value }))
          }
          className="select select-bordered w-full"
          required
          disabled={isSubmitting}
        >
          <option value="">เลือกจังหวัด</option>
          {THAI_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>

      {/* Farm Size */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">ขนาดพื้นที่ (ไร่)</span>
        </label>
        <input
          type="number"
          value={formData.size}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, size: e.target.value }))
          }
          className="input input-bordered w-full"
          placeholder="ระบุขนาดพื้นที่เป็นไร่"
          min="0.1"
          max="10000"
          step="0.1"
          disabled={isSubmitting}
        />
        <label className="label">
          <span className="label-text-alt text-gray-500">
            ระบุขนาดพื้นที่ฟาร์มเป็นไร่ (เช่น 5.5 ไร่)
          </span>
        </label>
      </div>

      {/* Crop Types */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">ประเภทพืชผลที่ปลูก</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {CROP_TYPES.map((crop) => (
            <label
              key={crop}
              className="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded"
            >
              <input
                type="checkbox"
                checked={formData.cropTypes.includes(crop)}
                onChange={(e) => handleCropTypeChange(crop, e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
                disabled={isSubmitting}
              />
              <span className="label-text text-sm">{crop}</span>
            </label>
          ))}
        </div>
        <label className="label">
          <span className="label-text-alt text-gray-500">
            เลือกประเภทพืชผลที่คุณปลูกในฟาร์ม (สามารถเลือกได้หลายประเภท)
          </span>
        </label>
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">รายละเอียดเพิ่มเติม</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="textarea textarea-bordered w-full h-24"
          placeholder="บอกเล่าเกี่ยวกับฟาร์มของคุณ เช่น วิธีการเลี้ยง เป้าหมาย หรือข้อมูลเพิ่มเติม"
          disabled={isSubmitting}
        />
        <label className="label">
          <span className="label-text-alt text-gray-500">
            ข้อมูลเพิ่มเติมเกี่ยวกับฟาร์มของคุณ (ไม่บังคับ)
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="form-control mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`}
        >
          {isSubmitting ? 'กำลังอัปเดต...' : 'อัปเดตฟาร์ม'}
        </button>
      </div>
    </form>
  )
}
