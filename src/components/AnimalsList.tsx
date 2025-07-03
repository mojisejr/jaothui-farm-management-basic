'use client'

import { useState } from 'react'
import { Search, Filter, RefreshCw, Plus } from 'lucide-react'
import { useFarmAnimals } from '@/hooks'
import AnimalCard from './AnimalCard'
import SearchBar, { AnimalSearchField } from './SearchBar'
import FilterDrawer, { AnimalFilters } from './FilterDrawer'
import Pagination from './common/Pagination'
import EmptyState from './common/EmptyState'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState<AnimalSearchField>('name')
  const [filters, setFilters] = useState<AnimalFilters>({})
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // React Query data fetching
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useFarmAnimals({
      farmId,
      page: currentPage,
      search: searchTerm.trim() || undefined,
      animalTypeId: filters.animalTypeId || undefined,
      limit: 20,
    })

  const animals = data?.animals || []
  const animalTypes = data?.animalTypes || []
  const pagination = data?.pagination

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter change
  const handleFiltersChange = (newFilters: AnimalFilters) => {
    setFilters(newFilters)
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
        {/* Search Bar */}
        <SearchBar
          context="animals"
          searchTerm={searchTerm}
          searchField={searchField}
          onSearchTermChange={setSearchTerm}
          onSearchFieldChange={(field) =>
            setSearchField(field as AnimalSearchField)
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
          {(filters.animalTypeId ||
            filters.dateRange?.from ||
            filters.dateRange?.to) && (
            <div className="badge badge-primary ml-2">•</div>
          )}
        </button>

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
        <EmptyState
          context="animals"
          isFiltered={Boolean(
            searchTerm.trim() ||
              filters.animalTypeId ||
              filters.dateRange?.from ||
              filters.dateRange?.to,
          )}
          farmId={farmId}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} farmId={farmId} />
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

      {/* Filter Drawer */}
      <FilterDrawer
        context="animals"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        animalTypes={animalTypes}
        isLoading={isLoading || isRefetching}
      />
    </div>
  )
}
