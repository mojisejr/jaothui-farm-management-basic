'use client'

import { Home, Plus, Edit, Users } from 'lucide-react'
import { PageLayout, type BreadcrumbItem } from './PageLayout'

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
        return 'w-full px-4 py-6' // Full width for lists
      default:
        return baseClasses
    }
  }

  // Build floating actions
  const floatingActions = (
    <div className="flex flex-col gap-3">
      {showCreateButton && (
        <a
          href="/farm/create"
          className="btn btn-primary btn-circle shadow-lg"
          title="สร้างฟาร์มใหม่"
        >
          <Plus className="w-5 h-5" />
        </a>
      )}
      {showMembersButton && farmId && (
        <a
          href={`/farm/${farmId}/members`}
          className="btn btn-secondary btn-circle shadow-lg"
          title="จัดการสมาชิก"
        >
          <Users className="w-5 h-5" />
        </a>
      )}
    </div>
  )

  return (
    <PageLayout
      // Navigation
      showBackButton={true}
      backUrl={backUrl}
      breadcrumbs={buildBreadcrumbs()}
      // Header
      title={title}
      subtitle={subtitle}
      // Layout
      variant="container"
      background="default"
      // Theme
      showThemeSelector={showThemeSelector}
      // Floating Actions
      floatingAction={
        showCreateButton || showMembersButton ? floatingActions : undefined
      }
      // Customization
      contentClassName={getContentClasses()}
      // Error Boundary
      error={error}
      onRetry={onRetry}
    >
      {/* Content based on variant */}
      {variant === 'form' ? (
        // Form variant: Card wrapper for forms
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">{children}</div>
        </div>
      ) : (
        // Default: Direct content rendering
        children
      )}
    </PageLayout>
  )
}

// Export convenience components
export default FarmLayout
