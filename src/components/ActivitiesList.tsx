'use client'

import { useState } from 'react'
import { Search, Filter, RefreshCw, Plus, Calendar } from 'lucide-react'
import { useFarmActivities } from '@/hooks'
import ActivityCard from './ActivityCard'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  notes: string | null
  activityDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  animal: Animal
}

interface StatusOption {
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
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // React Query data fetching
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useFarmActivities({
      farmId,
      page: currentPage,
      search: searchTerm.trim() || undefined,
      status: selectedStatus || undefined,
      limit: 10,
    })

  const activities = data?.activities || []
  const statuses = data?.statuses || []
  const pagination = data?.pagination

  // Handle search
  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle status filter
  const handleStatusFilter = (newStatus: string) => {
    setSelectedStatus(newStatus)
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

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        ยังไม่มีกิจกรรม
      </h3>
      <p className="text-gray-600 mb-6">
        {searchTerm || selectedStatus
          ? 'ไม่พบกิจกรรมที่ตรงกับการค้นหา'
          : 'เริ่มต้นด้วยการบันทึกกิจกรรมแรกของคุณ'}
      </p>
      <button
        className="btn btn-primary"
        onClick={() => {
          // TODO: Add create activity functionality
          alert('ฟีเจอร์สร้างกิจกรรมจะเพิ่มในเร็วๆ นี้')
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        เพิ่มกิจกรรม
      </button>
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
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="ค้นหากิจกรรม, ชื่อสัตว์..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline">
            <Filter className="w-4 h-4 mr-2" />
            {selectedStatus
              ? statuses.find((s) => s.value === selectedStatus)?.label ||
                'สถานะ'
              : 'สถานะ'}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-lg border"
          >
            <li>
              <button onClick={() => handleStatusFilter('')}>ทั้งหมด</button>
            </li>
            {statuses.map((status) => (
              <li key={status.value}>
                <button
                  onClick={() => handleStatusFilter(status.value)}
                  className={selectedStatus === status.value ? 'active' : ''}
                >
                  {status.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Results Count */}
      {pagination && (
        <div className="flex justify-between items-center text-sm text-base-content/70">
          <span>
            พบ {pagination.totalCount} กิจกรรม
            {searchTerm && ` สำหรับ "${searchTerm}"`}
            {selectedStatus &&
              ` สถานะ ${statuses.find((s) => s.value === selectedStatus)?.label}`}
          </span>
          <span>
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={!pagination.hasPrevious || isLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  «
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((pageNum) => {
                    // Show first page, last page, current page and adjacent pages
                    return (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      Math.abs(pageNum - currentPage) <= 2
                    )
                  })
                  .map((pageNum, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis =
                      index > 0 && pageNum - array[index - 1] > 1

                    return (
                      <div key={pageNum} className="join-item">
                        {showEllipsis && (
                          <button className="btn btn-disabled join-item">
                            ...
                          </button>
                        )}
                        <button
                          className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                          disabled={isLoading}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </div>
                    )
                  })}

                <button
                  className="join-item btn"
                  disabled={!pagination.hasNext || isLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  »
                </button>
              </div>
            </div>
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
