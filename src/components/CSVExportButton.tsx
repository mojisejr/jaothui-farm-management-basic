'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Activity,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { useCSVExport, type ExportType } from '@/hooks/useCSVExport'
import type { AnimalExportData } from '@/lib/csv-export'

interface CSVExportButtonProps {
  animal: AnimalExportData
  className?: string
  variant?: 'button' | 'dropdown' | 'inline'
  size?: 'sm' | 'md' | 'lg'
}

export function CSVExportButton({ 
  animal, 
  className = '', 
  variant = 'dropdown',
  size = 'md' 
}: CSVExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { exportAnimalData, isExporting, exportProgress } = useCSVExport({
    onExportSuccess: () => {
      setIsOpen(false)
    }
  })

  const handleExport = async (type: ExportType) => {
    await exportAnimalData(animal, type)
  }

  const exportOptions = [
    {
      key: 'report' as ExportType,
      label: 'รายงานสมบูรณ์',
      description: 'ข้อมูลพื้นฐาน + ประวัติกิจกรรม',
      icon: FileSpreadsheet,
      color: 'text-primary',
    },
    {
      key: 'basic' as ExportType,
      label: 'ข้อมูลพื้นฐาน',
      description: 'ข้อมูลทั่วไปของสัตว์',
      icon: FileText,
      color: 'text-info',
    },
    {
      key: 'activities' as ExportType,
      label: 'ประวัติกิจกรรม',
      description: 'กิจกรรมและกำหนดการ',
      icon: Activity,
      color: 'text-success',
    },
  ]

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  if (variant === 'inline') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {exportOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.key}
              onClick={() => handleExport(option.key)}
              disabled={isExporting}
              className={`btn btn-outline ${sizeClasses[size]} ${option.color}`}
              title={option.description}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleExport('report')}
        disabled={isExporting}
        className={`btn btn-primary ${sizeClasses[size]} ${className}`}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        ส่งออก CSV
      </button>
    )
  }

  // Dropdown variant (default)
  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <button
        tabIndex={0}
        role="button"
        className={`btn btn-outline ${sizeClasses[size]} ${isExporting ? 'loading' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {exportProgress?.step || 'กำลังส่งออก...'}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก CSV
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && !isExporting && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-80 border border-base-300"
            onBlur={() => setIsOpen(false)}
          >
            <div className="px-3 py-2 border-b border-base-300 mb-2">
              <h3 className="font-semibold text-sm">เลือกประเภทการส่งออก</h3>
              <p className="text-xs text-base-content/60">สำหรับ {animal.name}</p>
            </div>

            {exportOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <motion.li
                  key={option.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleExport(option.key)}
                    className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${option.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-base-content/60 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </button>
                </motion.li>
              )
            })}

            <div className="px-3 py-2 border-t border-base-300 mt-2">
              <p className="text-xs text-base-content/50">
                ไฟล์ CSV จะรองรับการแสดงผลภาษาไทยใน Excel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Progress Modal */}
      <AnimatePresence>
        {isExporting && exportProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {Math.round((exportProgress.current / exportProgress.total) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">กำลังส่งออกข้อมูล</h3>
                <p className="text-base-content/70 mb-4">{exportProgress.step}</p>
                
                <div className="w-full bg-base-300 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(exportProgress.current / exportProgress.total) * 100}%` 
                    }}
                    transition={{ duration: 0.3 }}
                    className="bg-primary h-2 rounded-full"
                  />
                </div>
                
                <div className="text-sm text-base-content/60 mt-2">
                  {exportProgress.current} จาก {exportProgress.total} ขั้นตอน
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MultipleCSVExportButtonProps {
  animals: AnimalExportData[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MultipleCSVExportButton({ 
  animals, 
  className = '',
  size = 'md' 
}: MultipleCSVExportButtonProps) {
  const { exportMultipleAnimals, isExporting, exportProgress } = useCSVExport()

  const handleExport = async () => {
    await exportMultipleAnimals(animals, 'basic')
  }

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting || animals.length === 0}
        className={`btn btn-primary ${sizeClasses[size]} ${className}`}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        ส่งออก {animals.length} ตัว
      </button>

      {/* Export Progress Modal */}
      <AnimatePresence>
        {isExporting && exportProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {Math.round((exportProgress.current / exportProgress.total) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">กำลังส่งออกข้อมูล</h3>
                <p className="text-base-content/70 mb-4">{exportProgress.step}</p>
                
                <div className="w-full bg-base-300 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(exportProgress.current / exportProgress.total) * 100}%` 
                    }}
                    transition={{ duration: 0.3 }}
                    className="bg-primary h-2 rounded-full"
                  />
                </div>
                
                <div className="text-sm text-base-content/60 mt-2">
                  {exportProgress.current} จาก {exportProgress.total} ขั้นตอน
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}