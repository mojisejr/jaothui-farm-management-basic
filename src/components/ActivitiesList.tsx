'use client'

import { useState } from 'react'
import { Filter, RefreshCw, Plus } from 'lucide-react'
import { useFarmActivities } from '@/hooks'
import ActivityCard from './ActivityCard'
import SearchBar, { ActivitySearchField } from './SearchBar'
import FilterDrawer, { ActivityFilters } from './FilterDrawer'
import Pagination from './common/Pagination'
import EmptyState from './common/EmptyState'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface _Activity {
  id: string
  title: string
  description: string | null
  notes: string | null
  activityDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  animal: Animal
}

interface _StatusOption {
  value: string
  label: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

interface ActivitiesListProps {
  farmId: string
}

export default function ActivitiesList({ farmId }: ActivitiesListProps) {
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState<ActivitySearchField>('name')
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // React Query data fetching
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useFarmActivities({
      farmId,
      page: currentPage,
      search: searchTerm.trim() || undefined,
      status: filters.status || undefined,
      limit: 20,
    })

  const activities = data?.activities || []
  const statuses = data?.statuses || []
  const pagination = data?.pagination

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter change
  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Handle refresh
  const handleRefresh = () => {
    refetch()
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <span>
            {error instanceof Error
              ? error.message
              : 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม'}
          </span>
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-sm"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'ลองใหม่'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )

  // Loading state for initial load
  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Search & Filter Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="skeleton h-10 flex-1"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>

        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-base-content">
            รายการกิจกรรม
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ติดตามและจัดการกิจกรรมสัตว์ในฟาร์ม
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-sm"
            disabled={isRefetching}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
            รีเฟรช
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              // TODO: Add create activity functionality
              alert('ฟีเจอร์สร้างกิจกรรมจะเพิ่มในเร็วๆ นี้')
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <SearchBar
          context="activities"
          searchTerm={searchTerm}
          searchField={searchField}
          onSearchTermChange={setSearchTerm}
          onSearchFieldChange={(field) =>
            setSearchField(field as ActivitySearchField)
          }
          onSearch={handleSearch}
          isLoading={isLoading || isRefetching}
          className="flex-1"
        />

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="btn btn-outline"
        >
          <Filter className="w-4 h-4 mr-2" />
          ตัวกรอง
          {(filters.status ||
            filters.dateRange?.from ||
            filters.dateRange?.to) && (
            <div className="badge badge-primary ml-2">•</div>
          )}
        </button>
      </div>

      {/* Results Count */}
      {pagination && (
        <div className="flex justify-between items-center text-sm text-base-content/70">
          <span>
            พบ {pagination.totalCount} กิจกรรม
            {searchTerm && ` สำหรับ "${searchTerm}"`}
            {filters.status &&
              ` สถานะ ${statuses.find((s) => s.value === filters.status)?.label}`}
          </span>
          <span>
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <EmptyState
          context="activities"
          isFiltered={Boolean(
            searchTerm ||
              filters.status ||
              filters.dateRange?.from ||
              filters.dateRange?.to,
          )}
          farmId={farmId}
          onCreateClick={() => {
            // TODO: Add create activity functionality
            alert('ฟีเจอร์สร้างกิจกรรมจะเพิ่มในเร็วๆ นี้')
          }}
        />
      ) : (
        <>
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
              isLoading={isLoading}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Loading overlay for pagination */}
      {isLoading && activities.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>กำลังโหลด...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
