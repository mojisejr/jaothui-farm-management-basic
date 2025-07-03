'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Calendar, ArrowLeft, Home } from 'lucide-react'
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
  const router = useRouter()

  const tabs = [
    {
      id: 'animals' as const,
      label: 'ข้อมูลสัตว์',
      icon: Users,
      component: AnimalsList,
    },
    {
      id: 'activities' as const,
      label: 'กิจกรรม',
      icon: Calendar,
      component: ActivitiesList,
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component

  return (
    <div className="w-full">
      {/* Header - Mobile Back Button + Desktop Breadcrumb */}
      <div className="mb-4">
        {/* Mobile Back Button */}
        <div className="md:hidden">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm gap-2 p-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">ย้อนกลับ</span>
          </button>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden md:block">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <a
                  href="/farms"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Home className="w-4 h-4" />
                  ฟาร์มของฉัน
                </a>
              </li>
              <li>
                <span className="text-base-content/70">{farmName}</span>
              </li>
              <li>
                <span className="text-base-content font-medium">Dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Farm Header Card */}
      <FarmHeaderCard farm={farm} />

      {/* Tab Navigation */}
      <div className="tabs tabs-bordered w-full mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab tab-lg flex-1 gap-2 ${
                activeTab === tab.id ? 'tab-active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content with Error Boundary and Suspense */}
      <div className="w-full">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error(`Error in ${activeTab} tab:`, error, errorInfo)
          }}
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center text-error mb-2">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล
                  </h3>
                  <p className="text-base-content/70 mb-4">
                    ไม่สามารถโหลดข้อมูล
                    {activeTab === 'animals' ? 'สัตว์' : 'กิจกรรม'}ได้
                    กรุณาลองใหม่
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
              {ActiveComponent && <ActiveComponent farmId={farmId} />}
            </SuspenseWrapper>
          </QueryErrorBoundary>
        </ErrorBoundary>
      </div>

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton activeTab={activeTab} farmId={farmId} />
    </div>
  )
}
