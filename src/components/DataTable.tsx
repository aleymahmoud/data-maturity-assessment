'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react'

// Types
export interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

export interface Filter {
  key: string
  label: string
  options: { value: string; label: string }[]
  multiple?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  filters?: Filter[]
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  onRowClick?: (item: T) => void
  renderActions?: (item: T) => React.ReactNode
  className?: string
}

// Badge component for status indicators
interface BadgeProps {
  children: React.ReactNode
  variant?: 'active' | 'inactive' | 'pending' | 'expired' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'active', icon }) => {
  const variants = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    danger: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {icon}
      {children}
    </span>
  )
}

// Multi-select dropdown component
interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span className="truncate">
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder
          }
        </span>
        <Filter size={16} className="text-gray-400 ml-2" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="max-h-60 overflow-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Main DataTable component
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filters = [],
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  loading = false,
  onRowClick,
  renderActions,
  className = ""
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  
  // Initialize filter state
  React.useEffect(() => {
    const initialFilters: Record<string, string[]> = {}
    filters.forEach(filter => {
      initialFilters[filter.key] = []
    })
    setActiveFilters(initialFilters)
  }, [filters])

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data

    // Apply search filter
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(activeFilters).forEach(([filterKey, filterValues]) => {
      if (filterValues.length > 0) {
        result = result.filter(item =>
          filterValues.includes(String(item[filterKey]))
        )
      }
    })

    return result
  }, [data, searchTerm, activeFilters])

  const handleFilterChange = (filterKey: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: values
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header Section with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          
          {/* Filters */}
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-[200px]">
              <MultiSelect
                options={filter.options}
                selected={activeFilters[filter.key] || []}
                onChange={(values) => handleFilterChange(filter.key, values)}
                placeholder={filter.label}
              />
            </div>
          ))}
        </div>
        
        {/* Active filters indicator */}
        {Object.values(activeFilters).some(filters => filters.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, values]) =>
              values.map(value => (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {value}
                  <button
                    onClick={() => handleFilterChange(key, values.filter(v => v !== value))}
                    className="hover:bg-blue-200 rounded-sm p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (renderActions ? 1 : 0)} 
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key])
                      }
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { Badge }