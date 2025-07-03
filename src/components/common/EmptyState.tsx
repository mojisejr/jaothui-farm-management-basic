'use client'

import { Plus, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  context: 'animals' | 'activities'
  isFiltered?: boolean
  farmId?: string
  onCreateClick?: () => void
  className?: string
}

export default function EmptyState({
  context,
  isFiltered = false,
  farmId,
  onCreateClick,
  className = '',
}: EmptyStateProps) {
  const config = {
    animals: {
      icon: Users,
      title: isFiltered
        ? 'ไม่พบสัตว์ที่ตรงกับการค้นหา'
        : 'ยังไม่มีสัตว์ในฟาร์ม',
      description: isFiltered
        ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล'
        : 'เริ่มต้นด้วยการลงทะเบียนสัตว์ตัวแรกของคุณ',
      buttonText: 'เพิ่มสัตว์',
      href: farmId ? `/animal/create?farmId=${farmId}` : '/animal/create',
    },
    activities: {
      icon: Calendar,
      title: isFiltered ? 'ไม่พบกิจกรรมที่ตรงกับการค้นหา' : 'ยังไม่มีกิจกรรม',
      description: isFiltered
        ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล'
        : 'เริ่มต้นด้วยการบันทึกกิจกรรมแรกของคุณ',
      buttonText: 'เพิ่มกิจกรรม',
      href: farmId ? `/activity/create?farmId=${farmId}` : '/activity/create',
    },
  }

  const { icon: Icon, title, description, buttonText, href } = config[context]

  return (
    <div className={`text-center py-12 ${className}`}>
      {/* Icon */}
      <div className="text-gray-300 mb-4">
        {context === 'animals' ? (
          // Custom SVG for animals (keeping the existing trash icon as fallback)
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ) : (
          <Icon className="w-16 h-16 mx-auto" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      {/* CTA Button - Only show for non-filtered empty states */}
      {!isFiltered && (
        <>
          {onCreateClick ? (
            // Custom onClick handler
            <button className="btn btn-primary" onClick={onCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              {buttonText}
            </button>
          ) : (
            // Link to create page
            <Link href={href} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              {buttonText}
            </Link>
          )}
        </>
      )}
    </div>
  )
}
