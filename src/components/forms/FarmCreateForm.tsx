'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'

import { farmSchema, type FarmFormData } from '@/types/farm'
import { thaiProvinces } from '@/constants/thaiProvinces'
import { createFarm } from '@/app/farm/create/actions'

export function FarmCreateForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    mode: 'onBlur',
  })

  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: FarmFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('province', data.province)

        const result = await createFarm({ message: '' }, formData)
        // We expect createFarm to redirect on success, but it also returns message on failure
        if (result?.message) {
          toast.error(result.message)
        }
      } catch (error) {
        console.error('Error creating farm:', error)
        toast.error('เกิดข้อผิดพลาด โปรดลองใหม่')
      }
    })
  }

  return (
    <div className="card w-full max-w-md shadow-2xl bg-base-100">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
        <div className="text-center mb-4">
          <h2 className="card-title text-2xl font-bold justify-center">
            <PlusCircle className="w-6 h-6 mr-2" />
            สร้างฟาร์มใหม่
          </h2>
        </div>

        {/* Farm Name */}
        <div className="form-control">
          <label className="label" htmlFor="name">
            <span className="label-text font-medium">ชื่อฟาร์ม</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="ชื่อฟาร์ม"
            className={`input input-bordered ${
              errors.name ? 'input-error' : ''
            } ${isPending ? 'input-disabled' : ''}`}
            disabled={isPending}
            {...register('name')}
          />
          {errors.name && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.name.message}
              </span>
            </label>
          )}
        </div>

        {/* Province Dropdown */}
        <div className="form-control">
          <label className="label" htmlFor="province">
            <span className="label-text font-medium">จังหวัด</span>
          </label>
          <select
            id="province"
            className={`select select-bordered ${
              errors.province ? 'select-error' : ''
            } ${isPending ? 'select-disabled' : ''}`}
            defaultValue=""
            disabled={isPending}
            {...register('province')}
          >
            <option value="" disabled>
              เลือกจังหวัด
            </option>
            {thaiProvinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.province && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.province.message}
              </span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${isPending ? 'btn-disabled' : ''}`}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            'สร้างฟาร์ม'
          )}
        </button>
      </form>
    </div>
  )
}
