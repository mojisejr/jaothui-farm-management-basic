'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { resetPasswordSimple } from './actions'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100">
        <form className="card-body">
          <input type="hidden" name="phone" value={phone || ''} />
          <h2 className="card-title">Reset Password</h2>
          <p className="text-sm">
            Enter the OTP sent to <strong>{phone}</strong> and your new
            password.
          </p>
          <div className="form-control">
            <label className="label" htmlFor="token">
              <span className="label-text">OTP Code</span>
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">New Password</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="confirmPassword">
              <span className="label-text">Confirm New Password</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="input input-bordered"
            />
          </div>
          <div className="form-control mt-6">
            <button
              formAction={resetPasswordSimple}
              className="btn btn-primary"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-base-200">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
