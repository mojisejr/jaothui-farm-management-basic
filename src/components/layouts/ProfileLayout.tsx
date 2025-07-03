'use client'

import { useState } from 'react'
import { User, Settings, Shield, Bell, LogOut, Home } from 'lucide-react'
import { PageLayout, type TabConfig, type BreadcrumbItem } from './PageLayout'

export interface ProfileLayoutProps {
  // Content
  children: React.ReactNode

  // Page Details
  title: string
  subtitle?: string

  // Layout Options
  variant?: 'default' | 'settings' | 'secure'
  background?: 'default' | 'gradient' | 'dark'

  // Dynamic Tabs Support
  tabs?: TabConfig[]
  activeTab?: string
  onTabChange?: (tabId: string) => void

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

// Default profile tabs - can be customized per page
const DEFAULT_PROFILE_TABS: TabConfig[] = [
  {
    id: 'profile',
    label: 'ข้อมูลส่วนตัว',
    icon: User,
  },
  {
    id: 'settings',
    label: 'ตั้งค่า',
    icon: Settings,
  },
  {
    id: 'security',
    label: 'ความปลอดภัย',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'การแจ้งเตือน',
    icon: Bell,
  },
]

export function ProfileLayout({
  children,
  title,
  subtitle,
  variant = 'default',
  background = 'gradient',
  tabs,
  activeTab,
  onTabChange,
  backUrl = '/farms',
  showHomeButton = true,
  showThemeSelector = false,
  showProfileQuickActions = false,
  profileActions,
  error,
  onRetry,
}: ProfileLayoutProps) {
  // Use provided tabs or default ones
  const profileTabs = tabs || DEFAULT_PROFILE_TABS
  const [currentTab, setCurrentTab] = useState(
    activeTab || profileTabs[0]?.id || 'profile',
  )

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId)
    onTabChange?.(tabId)
  }

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
    if (variant === 'settings') {
      breadcrumbs.push({ label: 'โปรไฟล์', href: '/profile' })
      breadcrumbs.push({ label: 'ตั้งค่า' })
    } else if (variant === 'secure') {
      breadcrumbs.push({ label: 'โปรไฟล์', href: '/profile' })
      breadcrumbs.push({ label: 'ความปลอดภัย' })
    } else {
      breadcrumbs.push({ label: 'โปรไฟล์' })
    }

    return breadcrumbs
  }

  // Get background style
  const getBackgroundStyle = () => {
    switch (background) {
      case 'gradient':
        return 'gradient'
      case 'dark':
        return 'dark'
      default:
        return 'default'
    }
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
      // Header
      title={title}
      subtitle={subtitle}
      // Layout - no header card as per requirement
      variant="container"
      background={getBackgroundStyle()}
      // Tabs - Dynamic tab support
      tabs={profileTabs}
      activeTab={activeTab || currentTab}
      onTabChange={handleTabChange}
      // Theme
      showThemeSelector={showThemeSelector}
      // Mobile Actions
      floatingAction={quickActions}
      // Error Handling
      error={error}
      onRetry={onRetry}
      // Profile-specific styling
      contentClassName="container mx-auto px-4 py-8 max-w-4xl"
    >
      {children}
    </PageLayout>
  )
}

// Export convenience props and types
export type { TabConfig } from './PageLayout'
export default ProfileLayout
