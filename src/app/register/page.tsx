import { Suspense } from 'react'
import { RegisterForm } from '@/components/forms/RegisterForm'

function RegisterFormWrapper() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8">
      <div className="w-full max-w-md px-4">
        <RegisterForm />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      }
    >
      <RegisterFormWrapper />
    </Suspense>
  )
}
