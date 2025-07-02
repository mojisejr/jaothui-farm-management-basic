'use client'

import React, { Suspense } from 'react'
import { RefreshCw } from 'lucide-react'

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string
}

const DefaultFallback = ({
  minHeight = 'min-h-[200px]',
}: {
  minHeight?: string
}) => (
  <div className={`${minHeight} flex items-center justify-center`}>
    <div className="flex flex-col items-center space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-base-content/70">กำลังโหลด...</span>
    </div>
  </div>
)

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  minHeight = 'min-h-[200px]',
}) => {
  return (
    <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
      {children}
    </Suspense>
  )
}

export default SuspenseWrapper

// Specific fallbacks for different contexts
export const TabContentFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="skeleton h-4 w-32"></div>
      <div className="skeleton h-4 w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-40 w-full"></div>
        ))}
      </div>
    </div>
  </div>
)

export const ListFallback = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="skeleton h-24 w-full"></div>
    ))}
  </div>
)
