'use client'

import { Home } from 'lucide-react'
import { PageLayout, type BreadcrumbItem } from './PageLayout'
import JaothuiLogo from '../JaothuiLogo'

export interface ProfileLayoutProps {
  // Content
  children: React.ReactNode

  // Page Details
  title: string
  subtitle?: string

  // Layout Options
  variant?: 'default' | 'settings' | 'secure'
  background?: 'default' | 'gradient' | 'dark'

  // Dynamic Tabs Support (removed for mobile-first design)
  // tabs?: TabConfig[]
  // activeTab?: string
  // onTabChange?: (tabId: string) => void

  // Navigation
  backUrl?: string
  showHomeButton?: boolean

  // Theme
  showThemeSelector?: boolean

  // Profile Context
  showProfileQuickActions?: boolean
  profileActions?: React.ReactNode

  // Error Handling
  error?: Error | null
  onRetry?: () => void
}

// Removed tabs for cleaner mobile interface

export function ProfileLayout({
  children,
  title,
  subtitle,
  variant: _variant = 'default',
  backUrl = '/farms',
  showHomeButton = true,
  showThemeSelector = false,
  showProfileQuickActions = false,
  profileActions,
  error,
  onRetry,
}: ProfileLayoutProps) {
  // Simplified - no tabs needed for mobile-first profile

  // Build breadcrumbs
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = []

    if (showHomeButton) {
      breadcrumbs.push({
        label: 'หน้าหลัก',
        href: '/farms',
        icon: Home,
      })
    }

    // Add profile context based on variant
    if (_variant === 'settings') {
      breadcrumbs.push({ label: 'โปรไฟล์', href: '/profile' })
      breadcrumbs.push({ label: 'ตั้งค่า' })
    } else if (_variant === 'secure') {
      breadcrumbs.push({ label: 'โปรไฟล์', href: '/profile' })
      breadcrumbs.push({ label: 'ความปลอดภัย' })
    } else {
      breadcrumbs.push({ label: 'โปรไฟล์' })
    }

    return breadcrumbs
  }

  // Profile quick actions for mobile
  const quickActions = showProfileQuickActions ? (
    <div className="flex flex-col gap-3">
      {profileActions}
      <a
        href="/farms"
        className="btn btn-primary btn-circle shadow-lg"
        title="ไปยังฟาร์มของฉัน"
      >
        <Home className="w-5 h-5" />
      </a>
    </div>
  ) : undefined

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
      // Header subtitle inside card
      title={title}
      subtitle={subtitle}
      // No tabs for cleaner mobile interface
      // Theme
      showThemeSelector={showThemeSelector}
      // Mobile Actions
      floatingAction={quickActions}
      // Error Handling
      error={error}
      onRetry={onRetry}
      // Content class inside big card
      contentClassName="max-w-4xl mx-auto"
    >
      {children}
    </PageLayout>
  )
}

// Export convenience props and types
export type { TabConfig } from './PageLayout'
export default ProfileLayout
