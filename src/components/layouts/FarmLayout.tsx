'use client'

import { Home, Plus, Users, User } from 'lucide-react'
import { PageLayout, type BreadcrumbItem } from './PageLayout'
import JaothuiLogo from '../JaothuiLogo'
import Link from 'next/link'

export interface FarmLayoutProps {
  // Content
  children: React.ReactNode

  // Page Details
  title: string
  subtitle?: string

  // Farm Context (for farm-specific pages)
  farmId?: string
  farmName?: string

  // Layout Options
  variant?: 'form' | 'content' | 'list'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  // Navigation
  backUrl?: string
  showCreateButton?: boolean
  showMembersButton?: boolean

  // Theme
  showThemeSelector?: boolean

  // Error Handling
  error?: Error | null
  onRetry?: () => void
}

export function FarmLayout({
  children,
  title,
  subtitle,
  farmId,
  farmName,
  variant = 'content',
  maxWidth = 'lg',
  backUrl,
  showCreateButton = false,
  showMembersButton = false,
  showThemeSelector = false,
  error,
  onRetry,
}: FarmLayoutProps) {
  // Build breadcrumbs based on context
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'ฟาร์มของฉัน',
        href: '/farms',
        icon: Home,
      },
    ]

    // Add farm context if available
    if (farmId && farmName) {
      breadcrumbs.push({
        label: farmName,
        href: `/farm/${farmId}/dashboard`,
      })
    }

    // Add current page context based on path
    if (typeof window !== 'undefined') {
      const path = window.location.pathname

      if (path.includes('/create')) {
        breadcrumbs.push({ label: 'สร้างฟาร์มใหม่' })
      } else if (path.includes('/edit')) {
        breadcrumbs.push({ label: 'แก้ไข' })
      } else if (path.includes('/members')) {
        breadcrumbs.push({ label: 'สมาชิก' })
      }
    }

    return breadcrumbs
  }

  // Get container max width classes
  const getMaxWidthClasses = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      case 'full':
        return 'max-w-full'
      default:
        return 'max-w-2xl'
    }
  }

  // Get content classes based on variant
  const getContentClasses = () => {
    const baseClasses = `mx-auto px-4 py-8 ${getMaxWidthClasses()}`

    switch (variant) {
      case 'form':
        return `${baseClasses} pb-24` // Extra bottom padding for forms
      case 'list':
        return 'px-4 py-6 max-w-6xl mx-auto'
      default:
        return baseClasses
    }
  }

  // Build floating actions
  const floatingActions = (
    <div className="flex flex-col gap-3 items-center">
      {showCreateButton && (
        <Link
          href="/farm/create"
          className="btn btn-primary btn-circle btn-lg shadow-lg hover:scale-110 transition-transform"
          title="สร้างฟาร์มใหม่"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}
      {showMembersButton && farmId && (
        <Link
          href={`/farm/${farmId}/members`}
          className="btn btn-secondary btn-circle btn-lg shadow-lg hover:scale-110 transition-transform"
          title="จัดการสมาชิก"
        >
          <Users className="w-6 h-6" />
        </Link>
      )}
    </div>
  )

  return (
    <PageLayout
      // Navigation
      showBackButton={true}
      backUrl={backUrl}
      breadcrumbs={buildBreadcrumbs()}
      // Dashboard Header
      variant="dashboard"
      background="dark"
      dashboardTitle={title}
      dashboardLogo={<JaothuiLogo />}
      dashboardRightActions={
        <Link
          href="/profile"
          className="btn btn-ghost btn-circle btn-sm"
          title="ไปยังโปรไฟล์"
        >
          <User className="w-4 h-4 text-white" />
        </Link>
      }
      // Header Subtitle (inside card header section)
      title={title}
      subtitle={subtitle}
      // Theme
      showThemeSelector={showThemeSelector}
      // Layout customization - keep extra padding for forms/lists if needed
      contentClassName={getContentClasses()}
      // Tabs / Floating actions remain unchanged
      floatingAction={
        showCreateButton || showMembersButton ? floatingActions : undefined
      }
      // Error Boundary
      error={error}
      {...(onRetry ? { onRetry } : {})}
    >
      {/* Render children directly; nested card for form variant inside big card */}
      {variant === 'form' ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body space-y-4">{children}</div>
        </div>
      ) : (
        children
      )}
    </PageLayout>
  )
}

// Export convenience components
export default FarmLayout
