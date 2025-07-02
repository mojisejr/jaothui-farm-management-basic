'use client'

import { useState } from 'react'
import { Search, Filter, RefreshCw, Plus } from 'lucide-react'
import { useFarmAnimals } from '@/hooks'
import AnimalCard from './AnimalCard'
import Link from 'next/link'

interface AnimalType {
  id: string
  name: string
}

interface Animal {
  id: string
  name: string
  microchip: string | null
  birthDate: string | null
  weight: number | null
  height: number | null
  color: string | null
  image: string | null
  createdAt: string
  animalType: AnimalType | null
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

interface AnimalsListProps {
  farmId: string
}

export default function AnimalsList({ farmId }: AnimalsListProps) {
  // Search & Filter states
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // React Query data fetching
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useFarmAnimals({
      farmId,
      page: currentPage,
      search: search.trim() || undefined,
      animalTypeId: selectedType || undefined,
      limit: 12,
    })

  const animals = data?.animals || []
  const animalTypes = data?.animalTypes || []
  const pagination = data?.pagination

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter change
  const handleTypeFilter = (typeId: string) => {
    setSelectedType(typeId)
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
              : 'เกิดข้อผิดพลาดในการดึงข้อมูลสัตว์'}
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

  // Loading state for initial load
  if (isLoading && animals.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search & Filter Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="skeleton h-10 flex-1"></div>
          <div className="skeleton h-10 w-40"></div>
          <div className="skeleton h-10 w-24"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-64 w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="join w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อ, เลขไมโครชิป, หรือสี..."
                className="input input-bordered join-item w-full pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary join-item"
              disabled={isLoading || isRefetching}
            >
              {isLoading || isRefetching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Type Filter */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline">
            <Filter className="w-4 h-4 mr-2" />
            {selectedType
              ? animalTypes.find((t) => t.id === selectedType)?.name ||
                'ประเภทสัตว์'
              : 'ประเภทสัตว์'}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border"
          >
            <li>
              <button onClick={() => handleTypeFilter('')}>ทั้งหมด</button>
            </li>
            {animalTypes.map((type) => (
              <li key={type.id}>
                <button
                  onClick={() => handleTypeFilter(type.id)}
                  className={selectedType === type.id ? 'active' : ''}
                >
                  {type.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add Animal Button */}
        <Link
          href={`/animal/create?farmId=${farmId}`}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสัตว์
        </Link>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          รายการสัตว์ {pagination && `(${pagination.totalCount} ตัว)`}
        </h2>
        <button
          onClick={handleRefresh}
          className="btn btn-outline btn-sm"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          รีเฟรช
        </button>
      </div>

      {/* Animals Grid */}
      {animals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search || selectedType
              ? 'ไม่พบสัตว์ที่ตรงกับการค้นหา'
              : 'ยังไม่มีสัตว์ในฟาร์ม'}
          </h3>
          <p className="text-gray-600 mb-6">
            {search || selectedType
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล'
              : 'เริ่มต้นด้วยการลงทะเบียนสัตว์ตัวแรกของคุณ'}
          </p>
          {!search && !selectedType && (
            <Link
              href={`/animal/create?farmId=${farmId}`}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสัตว์
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} farmId={farmId} />
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
      {isLoading && animals.length > 0 && (
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
