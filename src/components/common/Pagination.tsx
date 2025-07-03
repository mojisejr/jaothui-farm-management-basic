'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  isLoading = false,
  onPageChange,
  className = '',
}: PaginationProps) {
  // Don't show pagination if only one page
  if (totalPages <= 1) return null

  // Generate page numbers to show (desktop version)
  const getVisiblePages = () => {
    const delta = 2 // Show 2 pages around current page
    const start = Math.max(1, currentPage - delta)
    const end = Math.min(totalPages, currentPage + delta)

    const pages: number[] = []

    // Always show first page
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push(-1) // Ellipsis marker
      }
    }

    // Show pages around current page
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(-1) // Ellipsis marker
      }
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="join">
        {/* Previous button */}
        <button
          className="join-item btn btn-sm md:btn-md"
          disabled={!hasPrevious || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">ก่อนหน้า</span>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex join-item">
          {visiblePages.map((pageNum, index) => {
            if (pageNum === -1) {
              // Ellipsis
              return (
                <button
                  key={`ellipsis-${index}`}
                  className="join-item btn btn-sm md:btn-md btn-disabled"
                  disabled
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )
            }

            return (
              <button
                key={pageNum}
                className={`join-item btn btn-sm md:btn-md ${
                  currentPage === pageNum ? 'btn-active' : ''
                }`}
                disabled={isLoading}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Mobile: Current page indicator */}
        <div className="sm:hidden join-item">
          <span className="btn btn-sm btn-disabled">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Next button */}
        <button
          className="join-item btn btn-sm md:btn-md"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="หน้าถัดไป"
        >
          <span className="hidden sm:inline mr-1">ถัดไป</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
