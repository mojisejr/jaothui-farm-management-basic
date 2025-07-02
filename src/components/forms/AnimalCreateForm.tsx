'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  PawPrint,
  Calendar,
  Weight,
  Ruler,
  Palette,
  Heart,
  Plus,
  Loader2,
  Tag,
} from 'lucide-react'
import {
  animalRegistrationSchema,
  type AnimalRegistrationFormData,
  type AnimalType,
} from '@/types/database'

interface AnimalCreateFormProps {
  farmId: string
  onSuccess?: (animalId: string) => void
}

export function AnimalCreateForm({ farmId, onSuccess }: AnimalCreateFormProps) {
  const [isPending, startTransition] = useTransition()
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<AnimalRegistrationFormData>({
    resolver: zodResolver(animalRegistrationSchema),
    mode: 'onBlur',
    defaultValues: {
      farmId,
    },
  })

  // Load animal types
  useEffect(() => {
    const loadAnimalTypes = async () => {
      try {
        const response = await fetch('/api/animal-types')
        if (response.ok) {
          const types = await response.json()
          setAnimalTypes(types)
        } else {
          toast.error('ไม่สามารถโหลดประเภทสัตว์ได้')
        }
      } catch (error) {
        console.error('Error loading animal types:', error)
        toast.error('เกิดข้อผิดพลาดในการโหลดประเภทสัตว์')
      } finally {
        setIsLoadingTypes(false)
      }
    }

    loadAnimalTypes()
  }, [])

  // Convert Buddhist Era to Gregorian for date input
  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Convert Gregorian to Buddhist Era for display
  const getBuddhistYear = (gregorianYear: number) => {
    return gregorianYear + 543
  }

  const onSubmit = async (data: AnimalRegistrationFormData) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/animal/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include',
        })

        const result = await response.json()

        if (response.ok) {
          toast.success('เพิ่มสัตว์เลี้ยงสำเร็จ!')
          reset()
          if (onSuccess) {
            onSuccess(result.animalId)
          } else {
            router.push(`/farm/${farmId}`)
          }
        } else {
          toast.error(result.error || 'ไม่สามารถเพิ่มสัตว์เลี้ยงได้')
        }
      } catch (error) {
        console.error('Form submission error:', error)
        toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด')
      }
    })
  }

  if (isLoadingTypes) {
    return (
      <div className="card w-full shadow-2xl bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card w-full shadow-2xl bg-base-100">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body">
        <div className="text-center mb-6">
          <h2 className="card-title text-2xl font-bold justify-center">
            <PawPrint className="w-6 h-6 mr-2" />
            ลงทะเบียนสัตว์ใหม่
          </h2>
          <p className="text-base-content/60 mt-2">
            เพิ่มสัตว์เลี้ยงเข้าสู่ระบบ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Animal Name */}
          <div className="form-control md:col-span-2">
            <label className="label" htmlFor="name">
              <span className="label-text font-medium">
                <PawPrint className="w-4 h-4 inline mr-1" />
                ชื่อสัตว์ <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="เช่น ดาว, นักสู้, หนูน้อย"
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

          {/* Animal Type */}
          <div className="form-control">
            <label className="label" htmlFor="animalTypeId">
              <span className="label-text font-medium">
                ประเภทสัตว์ <span className="text-error">*</span>
              </span>
            </label>
            <select
              id="animalTypeId"
              className={`select select-bordered ${
                errors.animalTypeId ? 'select-error' : ''
              } ${isPending ? 'select-disabled' : ''}`}
              disabled={isPending}
              {...register('animalTypeId')}
              defaultValue=""
            >
              <option value="" disabled>
                เลือกประเภทสัตว์
              </option>
              {animalTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.description && `(${type.description})`}
                </option>
              ))}
            </select>
            {errors.animalTypeId && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.animalTypeId.message}
                </span>
              </label>
            )}
          </div>

          {/* Microchip */}
          <div className="form-control">
            <label className="label" htmlFor="microchip">
              <span className="label-text font-medium">
                <Tag className="w-4 h-4 inline mr-1" />
                ไมโครชิป
              </span>
            </label>
            <input
              id="microchip"
              type="text"
              placeholder="ระบุเลขไมโครชิป (ไม่กรอกระบบจะสร้างให้)"
              className={`input input-bordered ${
                errors.microchip ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('microchip')}
            />
            {errors.microchip && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.microchip.message}
                </span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt text-info">
                💡 หากไม่กรอก ระบบจะสร้างไมโครชิปอัตโนมัติ
              </span>
            </label>
          </div>

          {/* Birth Date */}
          <div className="form-control">
            <label className="label" htmlFor="birthDate">
              <span className="label-text font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันเกิด (พ.ศ.)
              </span>
            </label>
            <Controller
              name="birthDate"
              control={control}
              render={({ field: { onChange, value } }) => (
                <>
                  <input
                    id="birthDate"
                    type="date"
                    className={`input input-bordered ${
                      errors.birthDate ? 'input-error' : ''
                    } ${isPending ? 'input-disabled' : ''}`}
                    disabled={isPending}
                    value={formatDateForInput(value)}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : undefined
                      onChange(date)
                    }}
                  />
                  {value && (
                    <label className="label">
                      <span className="label-text-alt text-info">
                        ปี พ.ศ. {getBuddhistYear(value.getFullYear())}
                      </span>
                    </label>
                  )}
                </>
              )}
            />
            {errors.birthDate && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.birthDate.message}
                </span>
              </label>
            )}
          </div>

          {/* Weight */}
          <div className="form-control">
            <label className="label" htmlFor="weight">
              <span className="label-text font-medium">
                <Weight className="w-4 h-4 inline mr-1" />
                น้ำหนัก (กก.)
              </span>
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="เช่น 25.5"
              className={`input input-bordered ${
                errors.weight ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('weight', {
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
              })}
            />
            {errors.weight && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.weight.message}
                </span>
              </label>
            )}
          </div>

          {/* Height */}
          <div className="form-control">
            <label className="label" htmlFor="height">
              <span className="label-text font-medium">
                <Ruler className="w-4 h-4 inline mr-1" />
                ส่วนสูง (ซม.)
              </span>
            </label>
            <input
              id="height"
              type="number"
              step="0.1"
              min="0"
              placeholder="เช่น 65.0"
              className={`input input-bordered ${
                errors.height ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('height', {
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
              })}
            />
            {errors.height && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.height.message}
                </span>
              </label>
            )}
          </div>

          {/* Color */}
          <div className="form-control">
            <label className="label" htmlFor="color">
              <span className="label-text font-medium">
                <Palette className="w-4 h-4 inline mr-1" />
                สี/ลักษณะ
              </span>
            </label>
            <input
              id="color"
              type="text"
              placeholder="เช่น ดำ, ขาว, ลายจุด"
              className={`input input-bordered ${
                errors.color ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('color')}
            />
            {errors.color && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.color.message}
                </span>
              </label>
            )}
          </div>

          {/* Father Name */}
          <div className="form-control">
            <label className="label" htmlFor="fatherName">
              <span className="label-text font-medium">
                <Heart className="w-4 h-4 inline mr-1" />
                ชื่อพ่อพันธุ์
              </span>
            </label>
            <input
              id="fatherName"
              type="text"
              placeholder="ชื่อพ่อพันธุ์ (ถ้ามี)"
              className={`input input-bordered ${
                errors.fatherName ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('fatherName')}
            />
            {errors.fatherName && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.fatherName.message}
                </span>
              </label>
            )}
          </div>

          {/* Mother Name */}
          <div className="form-control">
            <label className="label" htmlFor="motherName">
              <span className="label-text font-medium">
                <Heart className="w-4 h-4 inline mr-1" />
                ชื่อแม่พันธุ์
              </span>
            </label>
            <input
              id="motherName"
              type="text"
              placeholder="ชื่อแม่พันธุ์ (ถ้ามี)"
              className={`input input-bordered ${
                errors.motherName ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('motherName')}
            />
            {errors.motherName && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.motherName.message}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-control mt-8">
          <button
            type="submit"
            className={`btn btn-primary ${isPending ? 'loading' : ''}`}
            disabled={isPending || !isValid}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                กำลังเพิ่มสัตว์...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มสัตว์เลี้ยง
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="text-center mt-4">
          <p className="text-sm text-base-content/60">
            <span className="text-error">*</span> ข้อมูลที่จำเป็นต้องกรอก
          </p>
          <p className="text-xs text-base-content/40 mt-1">
            สามารถกรอกไมโครชิปเองหรือให้ระบบสร้างอัตโนมัติ
          </p>
        </div>
      </form>
    </div>
  )
}
