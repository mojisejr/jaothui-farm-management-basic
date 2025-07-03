'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Users, Calendar, Home } from 'lucide-react'
import {
  PageLayout,
  type TabConfig,
  type BreadcrumbItem,
} from './layouts/PageLayout'
import ErrorBoundary, { QueryErrorBoundary } from './ErrorBoundary'
import SuspenseWrapper, { TabContentFallback } from './common/SuspenseWrapper'
import AnimalsList from './AnimalsList'
import ActivitiesList from './ActivitiesList'
import FarmHeaderCard from './FarmHeaderCard'
import FloatingActionButton from './common/FloatingActionButton'

interface FarmData {
  id: string
  name: string
  province: string
  size: number | null
  description: string | null
  isOwner: boolean
  isMember: boolean
  owner: {
    id: string
    firstName: string | null
    lastName: string | null
    phoneNumber: string
  }
  _count: {
    animals: number
    members: number
  }
}

interface DashboardLayoutProps {
  farmId: string
  farmName: string
  farm: FarmData
}

export default function DashboardLayout({
  farmId,
  farmName,
  farm,
}: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<'animals' | 'activities'>(
    'animals',
  )

  // Define breadcrumbs for desktop navigation
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'ฟาร์มของฉัน',
      href: '/farms',
      icon: Home,
    },
    {
      label: farmName,
    },
    {
      label: 'Dashboard',
    },
  ]

  // Define tabs with components and badges
  const tabs: TabConfig[] = [
    {
      id: 'animals',
      label: 'ข้อมูลสัตว์',
      icon: Users,
      badge: farm._count.animals > 0 ? farm._count.animals : undefined,
      component: () => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Error in animals tab:', error, errorInfo)
          }}
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center text-error mb-2">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล
                  </h3>
                  <p className="text-base-content/70 mb-4">
                    ไม่สามารถโหลดข้อมูลสัตว์ได้ กรุณาลองใหม่
                  </p>
                  <div className="card-actions justify-center">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => window.location.reload()}
                    >
                      รีเฟรชหน้า
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <QueryErrorBoundary>
            <SuspenseWrapper
              fallback={<TabContentFallback />}
              minHeight="min-h-[400px]"
            >
              <AnimalsList farmId={farmId} />
            </SuspenseWrapper>
          </QueryErrorBoundary>
        </ErrorBoundary>
      ),
    },
    {
      id: 'activities',
      label: 'กิจกรรม',
      icon: Calendar,
      component: () => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Error in activities tab:', error, errorInfo)
          }}
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center text-error mb-2">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล
                  </h3>
                  <p className="text-base-content/70 mb-4">
                    ไม่สามารถโหลดข้อมูลกิจกรรมได้ กรุณาลองใหม่
                  </p>
                  <div className="card-actions justify-center">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => window.location.reload()}
                    >
                      รีเฟรชหน้า
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <QueryErrorBoundary>
            <SuspenseWrapper
              fallback={<TabContentFallback />}
              minHeight="min-h-[400px]"
            >
              <ActivitiesList farmId={farmId} />
            </SuspenseWrapper>
          </QueryErrorBoundary>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <PageLayout
      // Header Navigation
      showBackButton={true}
      breadcrumbs={breadcrumbs}
      // Layout Options
      variant="dashboard"
      background="dark"
      // Dashboard Header
      dashboardTitle={farmName}
      dashboardLogo={
        <Image
          src="/images/jaothui-logo.png"
          alt="JAOTHUI Logo"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
      }
      // Header Content
      headerCard={<FarmHeaderCard farm={farm} />}
      // Mobile-First Tabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'animals' | 'activities')}
      // Floating Action Button (Mobile Only)
      floatingAction={
        <FloatingActionButton activeTab={activeTab} farmId={farmId} />
      }
    >
      {/* Content is handled through tabs, this empty div satisfies the children requirement */}
      <div />
    </PageLayout>
  )
}
