'use client'

import { Suspense } from 'react'
import { FarmCreateForm } from '@/components/forms/FarmCreateForm'

function FarmCreateContent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8">
      <FarmCreateForm />
    </div>
  )
}

export default function FarmCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-base-200">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <FarmCreateContent />
    </Suspense>
  )
}
