'use client'

import { ReactNode } from 'react'

interface GenericEmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export default function GenericEmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: GenericEmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {/* Icon */}
      <div className="text-base-content/30 mb-4 flex justify-center">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-base-content mb-2">{title}</h3>

      {/* Description */}
      <p className="text-base-content/60 mb-6 max-w-md mx-auto">{description}</p>

      {/* Action */}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  )
}