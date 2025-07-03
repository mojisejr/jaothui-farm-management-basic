'use client'

import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

// Define search field types
export type AnimalSearchField = 'name' | 'microchip'
export type ActivitySearchField = 'name' | 'microchip' | 'dueDate'

export interface SearchBarProps {
  // Context type to determine available fields
  context: 'animals' | 'activities'

  // Current search values
  searchTerm: string
  searchField: AnimalSearchField | ActivitySearchField

  // Callbacks
  onSearchTermChange: (term: string) => void
  onSearchFieldChange: (field: AnimalSearchField | ActivitySearchField) => void
  onSearch: () => void

  // Loading state
  isLoading?: boolean

  // Styling
  className?: string
}

interface SearchFieldOption {
  value: string
  label: string
  placeholder: string
}

export default function SearchBar({
  context,
  searchTerm,
  searchField,
  onSearchTermChange,
  onSearchFieldChange,
  onSearch,
  isLoading = false,
  className = '',
}: SearchBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Define available search fields based on context
  const getSearchFields = (): SearchFieldOption[] => {
    if (context === 'animals') {
      return [
        {
          value: 'name',
          label: 'ชื่อสัตว์',
          placeholder: 'ค้นหาด้วยชื่อสัตว์...',
        },
        {
          value: 'microchip',
          label: 'เลขไมโครชิป',
          placeholder: 'ค้นหาด้วยเลขไมโครชิป...',
        },
      ]
    } else {
      return [
        {
          value: 'name',
          label: 'ชื่อกิจกรรม',
          placeholder: 'ค้นหาด้วยชื่อกิจกรรม...',
        },
        {
          value: 'microchip',
          label: 'เลขไมโครชิป',
          placeholder: 'ค้นหาด้วยเลขไมโครชิปสัตว์...',
        },
        {
          value: 'dueDate',
          label: 'วันที่กำหนด',
          placeholder: 'ค้นหาด้วยวันที่กำหนด (YYYY-MM-DD)...',
        },
      ]
    }
  }

  const searchFields = getSearchFields()
  const currentField =
    searchFields.find((field) => field.value === searchField) || searchFields[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  const handleFieldSelect = (fieldValue: string) => {
    onSearchFieldChange(fieldValue as AnimalSearchField | ActivitySearchField)
    setIsDropdownOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="join w-full">
        {/* Search Field Selector Dropdown */}
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-outline join-item min-w-[140px] justify-between"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="truncate">{currentField.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {isDropdownOpen && (
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border mt-1"
            >
              {searchFields.map((field) => (
                <li key={field.value}>
                  <button
                    type="button"
                    onClick={() => handleFieldSelect(field.value)}
                    className={`${field.value === searchField ? 'active' : ''}`}
                  >
                    {field.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type={searchField === 'dueDate' ? 'date' : 'text'}
            placeholder={currentField.placeholder}
            className="input input-bordered join-item w-full pl-10"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="btn btn-primary join-item px-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading loading-spinner loading-sm"></div>
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  )
}
