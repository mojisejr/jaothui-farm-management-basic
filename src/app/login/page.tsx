import { Suspense } from 'react'
import { LoginForm } from '@/components/forms/LoginForm'

function LoginFormWrapper() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-200 to-base-300">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      }
    >
      <LoginFormWrapper />
    </Suspense>
  )
}
