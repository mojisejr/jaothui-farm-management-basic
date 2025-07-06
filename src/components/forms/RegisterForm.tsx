'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Phone, Lock, User, UserPlus } from 'lucide-react'
import { signup } from '@/app/register/actions'
import { registerSchema, type RegisterFormData } from '@/types/auth'

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('phone', data.phone)
        formData.append('password', data.password)
        formData.append('confirmPassword', data.confirmPassword)
        formData.append('firstName', data.firstName)
        formData.append('lastName', data.lastName)
        if (data.email) {
          formData.append('email', data.email)
        }

        const result = await signup(null, formData)

        if (result.success) {
          toast.success(result.message || 'Registration successful!')
          if (result.redirectUrl) {
            router.replace(result.redirectUrl)
            router.refresh()
          }
        } else {
          toast.error(result.message || 'Registration failed')
        }
      } catch (error) {
        console.error('Form submission error:', error)
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <div className="card w-full max-w-md shadow-2xl bg-base-100">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body">
        <div className="text-center mb-6">
          <h2 className="card-title text-2xl font-bold justify-center">
            <UserPlus className="w-6 h-6 mr-2" />
            สมัครสมาชิก
          </h2>
          <p className="text-base-content/60 mt-2">
            เริ่มต้นจัดการฟาร์มอย่างมืออาชีพ
          </p>
        </div>

        {/* Display server messages */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{decodeURIComponent(error)}</span>
          </div>
        )}
        {message && (
          <div className="alert alert-success mb-4">
            <span>{decodeURIComponent(message)}</span>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="firstName">
              <span className="label-text font-medium">
                <User className="w-4 h-4 inline mr-1" />
                ชื่อจริง
              </span>
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="ชื่อจริง"
              className={`input input-bordered ${
                errors.firstName ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('firstName')}
            />
            {errors.firstName && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.firstName.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="lastName">
              <span className="label-text font-medium">
                <User className="w-4 h-4 inline mr-1" />
                นามสกุล
              </span>
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="นามสกุล"
              className={`input input-bordered ${
                errors.lastName ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('lastName')}
            />
            {errors.lastName && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.lastName.message}
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="lastName">
            <span className="label-text font-medium">
              {/* <User className="w-4 h-4 inline mr-1" /> */}
              อีเมล
            </span>
          </label>
          <input
            id="email"
            type="text"
            placeholder="อีเมล"
            className={`input input-bordered ${
              errors.email ? 'input-error' : ''
            } ${isPending ? 'input-disabled' : ''}`}
            disabled={isPending}
            {...register('email')}
          />
          {errors.lastName && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.lastName.message}
              </span>
            </label>
          )}
        </div>

        {/* Phone Number Field */}
        <div className="form-control">
          <label className="label" htmlFor="phone">
            <span className="label-text font-medium">
              <Phone className="w-4 h-4 inline mr-1" />
              หมายเลขโทรศัพท์
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="เช่น 0812345678"
            className={`input input-bordered ${
              errors.phone ? 'input-error' : ''
            } ${isPending ? 'input-disabled' : ''}`}
            disabled={isPending}
            {...register('phone')}
          />
          {errors.phone && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.phone.message}
              </span>
            </label>
          )}
        </div>

        {/* Password Field */}
        <div className="form-control">
          <label className="label" htmlFor="password">
            <span className="label-text font-medium">
              <Lock className="w-4 h-4 inline mr-1" />
              รหัสผ่าน
            </span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="รหัสผ่านของคุณ"
              className={`input input-bordered w-full pr-12 ${
                errors.password ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.password.message}
              </span>
            </label>
          )}
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2">
              <div className="text-xs text-base-content/60 mb-1">
                ความแข็งแกร่งของรหัสผ่าน:
              </div>
              <div className="flex gap-1">
                <div
                  className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-success' : 'bg-base-300'}`}
                />
                <div
                  className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) ? 'bg-success' : 'bg-base-300'}`}
                />
                <div
                  className={`h-1 flex-1 rounded ${/[a-z]/.test(password) ? 'bg-success' : 'bg-base-300'}`}
                />
                <div
                  className={`h-1 flex-1 rounded ${/\d/.test(password) ? 'bg-success' : 'bg-base-300'}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-control">
          <label className="label" htmlFor="confirmPassword">
            <span className="label-text font-medium">
              <Lock className="w-4 h-4 inline mr-1" />
              ยืนยันรหัสผ่าน
            </span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="ยืนยันรหัสผ่าน"
              className={`input input-bordered w-full pr-12 ${
                errors.confirmPassword ? 'input-error' : ''
              } ${isPending ? 'input-disabled' : ''}`}
              disabled={isPending}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isPending}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.confirmPassword.message}
              </span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary ${isPending ? 'loading' : ''}`}
            disabled={isPending || !isValid}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                กำลังสมัครสมาชิก...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                สมัครสมาชิก
              </>
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center mt-4">
          <span className="label-text">มีบัญชีแล้ว? </span>
          <Link href="/login" className="link link-primary font-medium">
            เข้าสู่ระบบ
          </Link>
        </div>
      </form>
    </div>
  )
}
