'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Calendar, RotateCcw } from 'lucide-react'

// Filter types for different contexts
export interface AnimalFilters {
  animalTypeId?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

export interface ActivityFilters {
  status?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

export interface FilterDrawerProps {
  // Context
  context: 'animals' | 'activities'

  // Control
  isOpen: boolean
  onClose: () => void

  // Current filters
  filters: AnimalFilters | ActivityFilters
  onFiltersChange: (filters: AnimalFilters | ActivityFilters) => void

  // Filter options data
  animalTypes?: Array<{ id: string; name: string }>
  activityStatuses?: Array<{ value: string; label: string }>

  // Loading state
  isLoading?: boolean
}

// Helper function to format status labels
const _getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'รอดำเนินการ',
    IN_PROGRESS: 'กำลังดำเนินการ',
    COMPLETED: 'เสร็จสิ้น',
    CANCELLED: 'ยกเลิก',
  }
  return statusMap[status] || status
}

// Helper function to get status color
const _getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning',
    IN_PROGRESS: 'badge-info',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-error',
  }
  return statusColors[status] || 'badge-neutral'
}

export default function FilterDrawer({
  context,
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  animalTypes = [],
  activityStatuses = [],
  isLoading = false,
}: FilterDrawerProps) {
  // Local state for working with filters before applying
  const [localFilters, setLocalFilters] = useState(filters)

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Handle filter changes
  const handleAnimalTypeChange = (animalTypeId: string) => {
    if (context === 'animals') {
      setLocalFilters((prev) => ({
        ...prev,
        animalTypeId: animalTypeId || undefined,
      }))
    }
  }

  const handleStatusChange = (status: string) => {
    if (context === 'activities') {
      setLocalFilters((prev) => ({
        ...prev,
        status: status || undefined,
      }))
    }
  }

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value || undefined,
      },
    }))
  }

  // Apply filters
  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  // Clear all filters
  const handleClear = () => {
    const emptyFilters =
      context === 'animals'
        ? { animalTypeId: undefined, dateRange: undefined }
        : { status: undefined, dateRange: undefined }

    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    if (context === 'animals') {
      const animalFilters = localFilters as AnimalFilters
      return !!(
        animalFilters.animalTypeId ||
        animalFilters.dateRange?.from ||
        animalFilters.dateRange?.to
      )
    } else {
      const activityFilters = localFilters as ActivityFilters
      return !!(
        activityFilters.status ||
        activityFilters.dateRange?.from ||
        activityFilters.dateRange?.to
      )
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
        fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h3 className="text-lg font-semibold">ตัวกรอง</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-black">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-180px)]">
          {/* Animal Type Filter (Animals context only) */}
          {context === 'animals' && (
            <div className="space-y-3">
              <label className="label">
                <span className="label-text font-medium">ประเภทสัตว์</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={(localFilters as AnimalFilters).animalTypeId || ''}
                onChange={(e) => handleAnimalTypeChange(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                {animalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activity Status Filter (Activities context only) */}
          {context === 'activities' && (
            <div className="space-y-3">
              <label className="label">
                <span className="label-text font-medium">สถานะกิจกรรม</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={(localFilters as ActivityFilters).status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                {activityStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-3">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                ช่วงวันที่
              </span>
            </label>

            <div className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text text-sm">วันที่เริ่มต้น</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={localFilters.dateRange?.from || ''}
                  onChange={(e) =>
                    handleDateRangeChange('from', e.target.value)
                  }
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-sm">วันที่สิ้นสุด</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={localFilters.dateRange?.to || ''}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  min={localFilters.dateRange?.from || undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-base-200 bg-base-100">
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="btn btn-outline flex-1"
              disabled={isLoading || !hasActiveFilters()}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              ล้างทั้งหมด
            </button>
            <button
              onClick={handleApply}
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading loading-spinner loading-sm mr-2"></div>
              ) : (
                <Filter className="w-4 h-4 mr-2" />
              )}
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
