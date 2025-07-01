'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Phone, Lock, LogIn } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/types/auth'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginFormData) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: data.phone,
            password: data.password,
          }),
          credentials: 'include',
        })

        const result = await response.json()

        if (response.ok) {
          toast.success(result.message || 'เข้าสู่ระบบสำเร็จ')
          router.push('/profile')
          router.refresh()
        } else {
          toast.error(result.error || 'เข้าสู่ระบบไม่สำเร็จ')

          // Show validation errors if any
          if (result.error?.includes('ไม่พบบัญชีผู้ใช้')) {
            setError('phone', { message: 'ไม่พบบัญชีผู้ใช้' })
            setError('password', { message: 'หรือรหัสผ่านไม่ถูกต้อง' })
          }
        }
      } catch (error) {
        console.error('Form submission error:', error)
        toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด')
      }
    })
  }

  return (
    <div className="card w-full max-w-md shadow-2xl bg-base-100">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body">
        <div className="text-center mb-6">
          <h2 className="card-title text-2xl font-bold justify-center">
            <LogIn className="w-6 h-6 mr-2" />
            เข้าสู่ระบบ
          </h2>
          <p className="text-base-content/60 mt-2">
            ยินดีต้อนรับกลับสู่ Jaothui
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
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="label-text-alt link link-hover text-primary"
          >
            ลืมรหัสผ่าน?
          </Link>
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
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </div>

        {/* Register Link */}
        <div className="text-center mt-4">
          <span className="label-text">ยังไม่มีบัญชี? </span>
          <Link href="/register" className="link link-primary font-medium">
            สมัครสมาชิก
          </Link>
        </div>
      </form>
    </div>
  )
}
