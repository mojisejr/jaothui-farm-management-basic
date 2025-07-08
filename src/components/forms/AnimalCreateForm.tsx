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
  RefreshCw,
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isGeneratingMicrochip, setIsGeneratingMicrochip] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<AnimalRegistrationFormData>({
    resolver: zodResolver(animalRegistrationSchema),
    mode: 'onChange',
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

  const generateMicrochip = async () => {
    setIsGeneratingMicrochip(true)
    try {
      const response = await fetch('/api/animal/generate-microchip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ farmId }),
        credentials: 'include',
      })

      const result = await response.json()

      if (response.ok) {
        setValue('microchip', result.microchip)
        toast.success('สร้างไมโครชิปสำเร็จ')
      } else {
        toast.error(result.error || 'ไม่สามารถสร้างไมโครชิปได้')
      }
    } catch (error) {
      console.error('Generate microchip error:', error)
      toast.error('เกิดข้อผิดพลาดในการสร้างไมโครชิป')
    } finally {
      setIsGeneratingMicrochip(false)
    }
  }

  const onSubmit = async (data: AnimalRegistrationFormData) => {
    // simple client-side validation for image (optional route integration later)
    if (!imageFile) {
      setImageError('กรุณาเลือกรูปภาพสัตว์')
      return
    }

    startTransition(async () => {
      try {
        // Create FormData to handle file upload
        const formData = new FormData()
        
        // Add all form fields
        formData.append('farmId', data.farmId)
        formData.append('name', data.name)
        formData.append('animalTypeId', data.animalTypeId)
        formData.append('microchip', data.microchip)
        formData.append('birthDate', data.birthDate.toISOString())
        if (data.weight) formData.append('weight', data.weight.toString())
        if (data.height) formData.append('height', data.height.toString())
        if (data.color) formData.append('color', data.color)
        if (data.fatherName) formData.append('fatherName', data.fatherName)
        if (data.motherName) formData.append('motherName', data.motherName)
        if (data.notes) formData.append('notes', data.notes)
        
        // Add image file
        formData.append('image', imageFile)

        const response = await fetch('/api/animal/create', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        const result = await response.json()

        if (response.ok) {
          toast.success('เพิ่มสัตว์เลี้ยงสำเร็จ!')
          reset()
          setImageFile(null)
          setImagePreviewUrl(null)
          if (onSuccess) {
            onSuccess(result.animalId)
          } else {
            router.replace(`/farm/${farmId}`)
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
                ไมโครชิป <span className="text-error">*</span>
              </span>
            </label>
            <div className="join">
              <input
                id="microchip"
                type="text"
                placeholder="กรอกเลขไมโครชิป"
                className={`input input-bordered join-item flex-1 ${
                  errors.microchip ? 'input-error' : ''
                } ${isPending ? 'input-disabled' : ''}`}
                disabled={isPending}
                {...register('microchip')}
              />
              <button
                type="button"
                className={`btn btn-outline join-item ${
                  isGeneratingMicrochip ? 'loading' : ''
                }`}
                disabled={isPending || isGeneratingMicrochip}
                onClick={generateMicrochip}
              >
                {isGeneratingMicrochip ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                สร้าง
              </button>
            </div>
            {errors.microchip && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.microchip.message}
                </span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt text-info">
                💡 กรอกเอง หรือกดปุ่ม &quot;สร้าง&quot; เพื่อสร้างอัตโนมัติ
              </span>
            </label>
          </div>

          {/* Birth Date */}
          <div className="form-control">
            <label className="label" htmlFor="birthDate">
              <span className="label-text font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันเกิด (พ.ศ.) <span className="text-error">*</span>
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
              step="1"
              min="0"
              placeholder="เช่น 25"
              className={`input input-bordered ${
                errors.weight ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('weight', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
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
              step="1"
              min="0"
              placeholder="เช่น 65"
              className={`input input-bordered ${
                errors.height ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('height', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
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

          {/* Notes */}
          <div className="form-control md:col-span-2">
            <label className="label" htmlFor="notes">
              <span className="label-text font-medium">บันทึกเพิ่มเติม</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="รายละเอียด สุขภาพ หรือพฤติกรรมพิเศษ..."
              className={`textarea textarea-bordered ${
                errors.notes ? 'textarea-error' : ''
              } ${isPending ? 'textarea-disabled' : ''}`}
              disabled={isPending}
              {...register('notes')}
            />
            {errors.notes && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.notes.message}
                </span>
              </label>
            )}
          </div>

          {/* Photo Upload */}
          <div className="form-control md:col-span-2">
            <label className="label" htmlFor="photo">
              <span className="label-text font-medium">รูปสัตว์ (1 รูป) <span className="text-error">*</span></span>
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className={`file-input file-input-bordered w-full ${isPending ? 'file-input-disabled' : ''}`}
              disabled={isPending}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return

                // Validation: max 5MB, image type
                if (!file.type.startsWith('image/')) {
                  setImageError('ไฟล์ต้องเป็นรูปภาพ')
                  return
                }
                if (file.size > 5 * 1024 * 1024) {
                  setImageError('ขนาดไฟล์ต้องไม่เกิน 5MB')
                  return
                }

                setImageError(null)
                setImageFile(file)

                const reader = new FileReader()
                reader.onloadend = () => {
                  setImagePreviewUrl(reader.result as string)
                }
                reader.readAsDataURL(file)
              }}
            />
            {imageError && (
              <label className="label">
                <span className="label-text-alt text-error">{imageError}</span>
              </label>
            )}

            {imagePreviewUrl && (
              <div className="mt-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="ตัวอย่างรูปสัตว์"
                  className="max-h-48 rounded-lg shadow-md object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-control mt-8">
          <button
            type="submit"
            className={`btn btn-primary ${isPending ? 'loading' : ''}`}
            disabled={isPending || !isValid || !imageFile}
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
