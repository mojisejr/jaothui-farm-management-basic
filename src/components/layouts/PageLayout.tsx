'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTheme, ThemeSelector } from '@/contexts/ThemeContext'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface TabConfig {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  component?: React.ComponentType<Record<string, unknown>>
  badge?: string | number
}

export interface PageLayoutProps {
  // Header Navigation
  showBackButton?: boolean
  backUrl?: string | (() => void)
  breadcrumbs?: BreadcrumbItem[]

  // Header Content
  title?: string
  subtitle?: string
  headerCard?: React.ReactNode

  // Layout Options
  variant?: 'container' | 'full-width' | 'dashboard'
  background?: 'default' | 'gradient' | 'dark'

  // Theme Support
  themeOverride?: string
  showThemeSelector?: boolean

  // Content Slots
  children: React.ReactNode
  sidebar?: React.ReactNode
  floatingAction?: React.ReactNode

  // Mobile-First Tabs
  tabs?: TabConfig[]
  activeTab?: string
  onTabChange?: (tabId: string) => void

  // Dashboard Specific
  dashboardTitle?: string
  dashboardLogo?: React.ReactNode
  dashboardRightActions?: React.ReactNode

  // Customization
  className?: string
  contentClassName?: string

  // Error Boundary
  error?: Error | null
  onRetry?: () => void
}

export function PageLayout({
  // Header Navigation
  showBackButton = true,
  backUrl,
  breadcrumbs,

  // Header Content
  title,
  subtitle,
  headerCard,

  // Layout Options
  variant = 'container',
  background = 'default',

  // Theme Support
  themeOverride,
  showThemeSelector = false,

  // Content Slots
  children,
  sidebar,
  floatingAction,

  // Mobile-First Tabs
  tabs,
  activeTab,
  onTabChange,

  // Dashboard Specific
  dashboardTitle,
  dashboardLogo,
  dashboardRightActions,

  // Customization
  className = '',
  contentClassName = '',

  // Error Boundary
  error,
  onRetry,
}: PageLayoutProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [localActiveTab, setLocalActiveTab] = useState(
    activeTab || tabs?.[0]?.id || '',
  )

  // Handle back navigation
  const handleBack = () => {
    if (typeof backUrl === 'function') {
      backUrl()
    } else if (typeof backUrl === 'string') {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setLocalActiveTab(tabId)
    onTabChange?.(tabId)
  }

  // Get background classes
  const getBackgroundClasses = () => {
    switch (background) {
      case 'gradient':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'
      case 'dark':
        return 'bg-[#414141]'
      default:
        return 'bg-base-100'
    }
  }

  // Get container classes
  const getContainerClasses = () => {
    switch (variant) {
      case 'full-width':
        return 'w-full'
      case 'dashboard':
        return 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
      default:
        return 'container mx-auto px-4 sm:px-6 lg:px-8'
    }
  }

  // Find active tab component
  const ActiveTabComponent = tabs?.find(
    (tab) => tab.id === (activeTab || localActiveTab),
  )?.component

  // Apply theme override if provided
  const themeToUse = themeOverride || theme

  return (
    <div
      className={`min-h-screen ${getBackgroundClasses()} ${className}`}
      data-theme={themeToUse}
    >
      {/* Dashboard Header (only for dashboard variant) */}
      {variant === 'dashboard' && (dashboardTitle || dashboardLogo) && (
        <div className="flex justify-between items-center p-4 text-white">
          <div className="flex items-center gap-3">
            {dashboardLogo}
            <h1 className="text-xl font-semibold text-white">{dashboardTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            {dashboardRightActions}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={getContainerClasses()}>
        {/* Content Container - with special handling for dashboard */}
        <div
          className={
            variant === 'dashboard'
              ? `bg-white rounded-lg shadow-lg mx-4 p-6 min-h-[80vh] ${contentClassName}`
              : ''
          }
        >
          {/* Header Section */}
          <div
            className={
              variant === 'dashboard'
                ? ''
                : `${background === 'dark' ? 'text-white' : ''}`
            }
          >
            {/* Mobile Back Button / Desktop Breadcrumb */}
            <div className="py-4">
              {/* Mobile Back Button */}
              {showBackButton && (
                <div className="md:hidden">
                  <button
                    onClick={handleBack}
                    className="btn btn-ghost btn-sm gap-2 p-2 -ml-2 text-black"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">ย้อนกลับ</span>
                  </button>
                </div>
              )}

              {/* Desktop Breadcrumb */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="hidden md:block">
                  <div className="breadcrumbs text-sm">
                    <ul>
                      {breadcrumbs.map((crumb, index) => {
                        const Icon = crumb.icon
                        return (
                          <li key={index}>
                            {crumb.href ? (
                              <a
                                href={crumb.href}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                {Icon && <Icon className="w-4 h-4" />}
                                {crumb.label}
                              </a>
                            ) : (
                              <span
                                className={`flex items-center gap-1 ${
                                  index === breadcrumbs.length - 1
                                    ? 'text-base-content font-medium'
                                    : 'text-base-content/70'
                                }`}
                              >
                                {Icon && <Icon className="w-4 h-4" />}
                                {crumb.label}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* Header Title & Theme Selector */}
              {(title || showThemeSelector) && (
                <div className="flex justify-between items-center mt-4 md:mt-0">
                  <div>
                    {title && (
                      <h1 className="text-2xl md:text-3xl font-bold mb-1">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-base-content/70">{subtitle}</p>
                    )}
                  </div>
                  {showThemeSelector && <ThemeSelector className="ml-4" />}
                </div>
              )}
            </div>
          </div>

          {/* Header Card */}
          {headerCard && <div className="mb-6">{headerCard}</div>}

          {/* Tab Navigation */}
          {tabs && tabs.length > 0 && (
            <div className="tabs tabs-bordered w-full mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = (activeTab || localActiveTab) === tab.id
                return (
                  <button
                    key={tab.id}
                    className={`tab tab-lg flex-1 gap-2 ${
                      isActive ? 'tab-active' : ''
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {tab.label}
                    {tab.badge && (
                      <span className="badge badge-sm">{tab.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex gap-6">
            {/* Sidebar */}
            {sidebar && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                {sidebar}
              </aside>
            )}

            {/* Main Content Area */}
            <main
              className={`flex-1 ${variant !== 'dashboard' ? contentClassName : ''}`}
            >
              {error ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                      <h3 className="card-title justify-center text-error mb-2">
                        เกิดข้อผิดพลาดในการโหลดข้อมูล
                      </h3>
                      <p className="text-base-content/70 mb-4">
                        {error.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'}
                      </p>
                      <div className="card-actions justify-center">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={onRetry || (() => window.location.reload())}
                        >
                          ลองใหม่
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab Content */}
                  {ActiveTabComponent ? <ActiveTabComponent /> : children}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {floatingAction && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden safe-area-bottom">
          {floatingAction}
        </div>
      )}

      {/* Dark background footer for dashboard variant */}
      {variant === 'dashboard' && background === 'dark' && (
        <div className="px-4 py-6">
          <div className={getContainerClasses()}>
            <a
              href="/farms"
              className="btn btn-outline btn-block text-white border-white hover:bg-white hover:text-neutral"
            >
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export commonly used components for convenience
export { ThemeSelector } from '@/contexts/ThemeContext'
