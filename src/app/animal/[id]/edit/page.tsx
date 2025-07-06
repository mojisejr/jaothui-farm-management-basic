'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  PawPrint,
  Calendar,
  Weight,
  Ruler,
  Palette,
  Heart,
  Save,
  Loader2,
  Tag,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'
import { useAnimal, useUpdateAnimal } from '@/hooks/useFarmAnimals'
import { useAnimalTypes } from '@/hooks/useAnimalTypes'
import {
  animalRegistrationSchema,
  type AnimalRegistrationFormData,
} from '@/types/database'

export default function AnimalEditPage() {
  const params = useParams()
  const router = useRouter()
  const animalId = params.id as string
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const { data: animalData, isLoading: isLoadingAnimal, error: animalError } = useAnimal(animalId)
  const { data: animalTypes, isLoading: isLoadingTypes } = useAnimalTypes()
  const updateAnimal = useUpdateAnimal()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<AnimalRegistrationFormData>({
    resolver: zodResolver(animalRegistrationSchema),
    mode: 'onBlur',
  })

  // Pre-populate form when animal data loads
  useEffect(() => {
    if (animalData?.animal) {
      const animal = animalData.animal
      reset({
        farmId: animal.farm.id,
        name: animal.name,
        animalTypeId: animal.animalType?.id || '',
        microchip: animal.microchip || undefined,
        birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
        weight: animal.weight || undefined,
        height: animal.height || undefined,
        color: animal.color || undefined,
        fatherName: animal.fatherName || undefined,
        motherName: animal.motherName || undefined,
        notes: animal.notes || undefined,
      })
      
      // Set existing photo as preview
      if (animal.photoUrl) {
        setImagePreviewUrl(animal.photoUrl)
      }
    }
  }, [animalData, reset])

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
        let submitData: FormData | AnimalRegistrationFormData

        if (imageFile) {
          // Create FormData if new image is uploaded
          const formData = new FormData()
          
          // Add all form fields
          formData.append('name', data.name)
          formData.append('animalTypeId', data.animalTypeId)
          if (data.microchip) formData.append('microchip', data.microchip)
          if (data.birthDate) formData.append('birthDate', data.birthDate.toISOString())
          if (data.weight) formData.append('weight', data.weight.toString())
          if (data.height) formData.append('height', data.height.toString())
          if (data.color) formData.append('color', data.color)
          if (data.fatherName) formData.append('fatherName', data.fatherName)
          if (data.motherName) formData.append('motherName', data.motherName)
          if (data.notes) formData.append('notes', data.notes)
          
          // Add new image file
          formData.append('image', imageFile)
          
          submitData = formData
        } else {
          // Use JSON if no new image
          submitData = data
        }

        await updateAnimal.mutateAsync({
          animalId,
          data: submitData,
        })

        toast.success('อัพเดทข้อมูลสัตว์สำเร็จ!')
        router.replace(`/animal/${animalId}`)
      } catch (error) {
        console.error('Update error:', error)
        toast.error(error instanceof Error ? error.message : 'ไม่สามารถอัพเดทข้อมูลสัตว์ได้')
      }
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  if (isLoadingAnimal || isLoadingTypes) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (animalError || !animalData?.animal) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-error" />
          <p className="text-lg mb-4">ไม่สามารถโหลดข้อมูลสัตว์ได้</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            กลับไปหน้าก่อน
          </button>
        </div>
      </div>
    )
  }

  const animal = animalData.animal

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push(`/animal/${animalId}`)}
            className="btn btn-ghost"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปดูข้อมูล
          </button>
          
          <h1 className="text-2xl font-bold">แก้ไขข้อมูล {animal.name}</h1>
          
          <div /> {/* Spacer for flex layout */}
        </div>

        <div className="card w-full max-w-4xl mx-auto shadow-2xl bg-base-100">
          <form onSubmit={handleSubmit(onSubmit)} className="card-body">
            <div className="text-center mb-6">
              <h2 className="card-title text-2xl font-bold justify-center">
                <PawPrint className="w-6 h-6 mr-2" />
                แก้ไขข้อมูลสัตว์
              </h2>
              <p className="text-base-content/60 mt-2">
                อัพเดทข้อมูล {animal.name}
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
                >
                  <option value="" disabled>
                    เลือกประเภทสัตว์
                  </option>
                  {animalTypes?.map((type) => (
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
                  placeholder="ระบุเลขไมโครชิป"
                  className={`input input-bordered ${
                    errors.microchip ? 'input-error' : ''
                  } ${isPending ? 'input-disabled' : ''}`}
                  disabled={isPending}
                  {...register('microchip', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
                {errors.microchip && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.microchip.message}
                    </span>
                  </label>
                )}
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
                  <span className="label-text font-medium">รูปสัตว์ (เปลี่ยนรูปใหม่ - ไม่บังคับ)</span>
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className={`file-input file-input-bordered w-full ${isPending ? 'file-input-disabled' : ''}`}
                  disabled={isPending}
                  onChange={handleImageChange}
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
                      alt={imageFile ? "ตัวอย่างรูปใหม่" : "รูปปัจจุบัน"}
                      className="max-h-48 rounded-lg shadow-md object-cover"
                    />
                    <div className="ml-2 text-xs text-base-content/60 self-center">
                      {imageFile ? "🆕 รูปใหม่" : "📷 รูปปัจจุบัน"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-8">
              <button
                type="submit"
                className={`btn btn-primary ${isPending || updateAnimal.isPending ? 'loading' : ''}`}
                disabled={isPending || updateAnimal.isPending || !isValid}
              >
                {isPending || updateAnimal.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    บันทึกการเปลี่ยนแปลง
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
                หากไม่อัพโหลดรูปใหม่ รูปเดิมจะถูกเก็บไว้
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}