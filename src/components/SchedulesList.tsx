'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, RefreshCw, Plus, Clock } from 'lucide-react'
import { useFarmSchedules } from '@/hooks/useFarmSchedules'
import ScheduleCard from './ScheduleCard'
import Pagination from './common/Pagination'
import GenericEmptyState from './common/GenericEmptyState'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface _Schedule {
  id: string
  title: string
  description: string | null
  notes: string | null
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRecurring: boolean
  recurrenceType: string | null
  createdAt: string
  animal: Animal
}

interface SchedulesListProps {
  farmId: string
}

export function SchedulesList({ farmId }: SchedulesListProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const {
    data: schedulesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useFarmSchedules({
    farmId,
    page: currentPage,
    search: searchTerm,
    status: selectedStatus,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status)
    setCurrentPage(1) // Reset to first page when filtering
    setShowFilters(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>เกิดข้อผิดพลาดในการโหลดข้อมูลกำหนดการ</span>
          <button onClick={handleRefresh} className="btn btn-sm btn-ghost">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  const schedules = schedulesData?.schedules || []
  const pagination = schedulesData?.pagination
  const statuses = schedulesData?.statuses || []

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-base-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 w-full sm:max-w-md">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="ค้นหากำหนดการ หรือชื่อสัตว์..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(true)}
              className="btn btn-outline btn-sm flex-1 sm:flex-none"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">ตัวกรอง</span>
              {selectedStatus && (
                <div className="badge badge-primary badge-xs"></div>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className={`btn btn-ghost btn-sm ${isRefetching ? 'loading' : ''}`}
              disabled={isRefetching}
            >
              {!isRefetching && <RefreshCw size={16} />}
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="p-4">
        {schedules.length === 0 ? (
          <GenericEmptyState
            icon={<Clock className="w-12 h-12 text-base-content/30" />}
            title="ไม่มีกำหนดการ"
            description={
              searchTerm || selectedStatus
                ? "ไม่พบกำหนดการที่ตรงกับการค้นหา"
                : "ยังไม่มีกำหนดการในฟาร์มนี้"
            }
            action={
              <button
                onClick={() => router.push(`/schedule/create?farmId=${farmId}`)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                เพิ่มกำหนดการแรก
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                farmId={farmId}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-base-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-base-100 w-full max-w-sm h-full overflow-y-auto">
            <div className="p-4 border-b border-base-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ตัวกรองกำหนดการ</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="label">
                    <span className="label-text">สถานะ</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="">ทุกสถานะ</option>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setSelectedStatus('')
                    setSearchTerm('')
                    setCurrentPage(1)
                    setShowFilters(false)
                  }}
                  className="btn btn-ghost flex-1"
                >
                  ล้างตัวกรอง
                </button>
                <button
                  onClick={() => {
                    handleFilterChange(selectedStatus)
                  }}
                  className="btn btn-primary flex-1"
                >
                  ใช้ตัวกรอง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulesList