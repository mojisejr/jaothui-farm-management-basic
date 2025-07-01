'use client'

import { useActionState } from 'react'
import { forgotPassword } from './actions'

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPassword, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ลืมรหัสผ่าน
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              อีเมล
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="กรอกอีเมลของคุณ"
            />
          </div>

          {state && !state.success && (
            <div className="text-red-600 text-sm text-center">
              {state.message}
            </div>
          )}

          {state && state.success && (
            <div className="text-green-600 text-sm text-center">
              {state.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
