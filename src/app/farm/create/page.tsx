'use client'
import { createFarm } from './actions'
import { THAI_PROVINCES } from '@/types/farm'
import { useActionState, useTransition } from 'react'
import FarmLayout from '@/components/layouts/FarmLayout'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const initialState = {
  message: '',
  success: false,
}

export default function CreateFarmPage() {
  const [state, formAction] = useActionState(createFarm, initialState)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (state.success && 'farmId' in state && state.farmId) {
      toast.success('สร้างฟาร์มสำเร็จ!')
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/farm/${state.farmId}`)
      }, 1500)
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <FarmLayout
      title="สร้างฟาร์มใหม่"
      subtitle="เริ่มต้นสร้างฟาร์มของคุณและจัดการข้อมูลสัตว์เลี้ยง"
      variant="form"
      maxWidth="lg"
      backUrl="/farms"
    >
      <form action={(formData) => {
        startTransition(() => {
          formAction(formData)
        })
      }}>
        {/* ชื่อฟาร์ม */}
        <div className="form-control">
          <label className="label" htmlFor="name">
            <span className="label-text">ชื่อฟาร์ม</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input input-bordered"
            placeholder="เช่น ฟาร์มเจ้าทุ่ย"
          />
        </div>

        {/* จังหวัด */}
        <div className="form-control mt-4">
          <label className="label" htmlFor="province">
            <span className="label-text">จังหวัด</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            id="province"
            name="province"
            required
            className="select select-bordered"
            defaultValue=""
          >
            <option disabled value="">
              เลือกจังหวัด
            </option>
            {THAI_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        {/* ขนาดพื้นที่ */}
        <div className="form-control mt-4">
          <label className="label" htmlFor="size">
            <span className="label-text">ขนาดพื้นที่ (ไร่)</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id="size"
            name="size"
            type="number"
            step="0.1"
            min="0.1"
            max="10000"
            required
            className="input input-bordered"
            placeholder="เช่น 5.5"
          />
        </div>

        {/* รายละเอียดเพิ่มเติม */}
        <div className="form-control mt-4">
          <label className="label" htmlFor="description">
            <span className="label-text">รายละเอียดเพิ่มเติม</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="textarea textarea-bordered h-24"
            placeholder="บอกเล่าเกี่ยวกับฟาร์มของคุณ (ไม่จำเป็น)"
          />
        </div>

        {/* Submit Button */}
        <div className="form-control mt-6">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner"></span>
                กำลังสร้างฟาร์ม...
              </>
            ) : (
              'สร้างฟาร์ม'
            )}
          </button>
        </div>

        {/* Error Message */}
        {state?.message && (
          <div className="alert alert-error mt-4">
            <span>{state.message}</span>
          </div>
        )}
      </form>
    </FarmLayout>
  )
}
