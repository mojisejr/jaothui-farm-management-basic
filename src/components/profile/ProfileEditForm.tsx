'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { JWTUser } from '@/types/auth'
import { Profile } from '@/types/database'
import { Save, X } from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from './ImageUpload'

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'กรุณาระบุชื่อ')
    .max(50, 'ชื่อไม่ควรเกิน 50 ตัวอักษร'),
  lastName: z
    .string()
    .min(1, 'กรุณาระบุนามสกุล')
    .max(50, 'นามสกุลไม่ควรเกิน 50 ตัวอักษร'),
  phoneNumber: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditFormProps {
  user: JWTUser
  profile: Profile | null
  onCancel: () => void
  onSuccess: () => void
  updateProfileAction: (
    formData: FormData,
  ) => Promise<{ success?: boolean; error?: string }>
}

export default function ProfileEditForm({
  user,
  profile,
  onCancel,
  onSuccess,
  updateProfileAction,
}: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [profileImage, setProfileImage] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || user.user_metadata.firstName || '',
      lastName: profile?.lastName || user.user_metadata.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('firstName', data.firstName)
        formData.append('lastName', data.lastName)
        formData.append('phoneNumber', data.phoneNumber || '')

        if (profileImage) {
          formData.append('profileImage', profileImage)
        }

        const result = await updateProfileAction(formData)

        if (result.success) {
          toast.success('อัปเดตโปรไฟล์สำเร็จ')
          onSuccess()
        } else {
          toast.error(result.error || 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์')
        }
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์')
        console.error('Profile update error:', error)
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isPending}
        >
          <X size={16} />
          ยกเลิก
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Image Upload */}
        <ImageUpload
          currentImage={profile?.profileImage}
          onImageSelect={(file, _preview) => {
            setProfileImage(file)
          }}
          disabled={isPending}
        />

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ชื่อ *
            </label>
            <input
              {...register('firstName')}
              type="text"
              id="firstName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isPending}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              นามสกุล *
            </label>
            <input
              {...register('lastName')}
              type="text"
              id="lastName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isPending}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            เบอร์โทรสำรอง
          </label>
          <input
            {...register('phoneNumber')}
            type="tel"
            id="phoneNumber"
            placeholder="081-234-5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรหลัก (ไม่สามารถแก้ไขได้)
            </label>
            <input
              type="text"
              value={user.phone || 'ไม่ระบุ'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล (ไม่สามารถแก้ไขได้)
            </label>
            <input
              type="email"
              value={user.email || 'ไม่ระบุ'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              disabled
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isPending}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending || !isDirty}
          >
            <Save size={16} />
            {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </form>
    </div>
  )
}
