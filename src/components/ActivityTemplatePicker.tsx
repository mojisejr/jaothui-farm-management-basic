'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Clock, FileText, Lightbulb, X } from 'lucide-react'
import { useActivityTemplates, useSearchTemplates } from '@/hooks/useActivityTemplates'
import { type ActivityTemplate, ACTIVITY_CATEGORIES } from '@/constants/activity-templates'

interface ActivityTemplatePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ActivityTemplate) => void
  selectedCategoryId?: string
  schedulableOnly?: boolean
  title?: string
  subtitle?: string
}

export function ActivityTemplatePicker({
  isOpen,
  onClose,
  onSelectTemplate,
  selectedCategoryId,
  schedulableOnly = false,
  title = 'เลือกเทมเพลตกิจกรรม',
  subtitle = 'เลือกเทมเพลตที่เหมาะสมสำหรับกิจกรรมของคุณ'
}: ActivityTemplatePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(selectedCategoryId || '')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Use search if there's a query, otherwise use filtered templates
  const { data: searchResults } = useSearchTemplates(searchQuery, !!searchQuery.trim())
  const { data: templatesData, isLoading } = useActivityTemplates({
    categoryId: selectedCategory || undefined,
    schedulableOnly,
    enabled: !searchQuery.trim()
  })

  const templates = searchQuery.trim() ? (searchResults || []) : (templatesData?.templates || [])
  const categories = templatesData?.categories || ACTIVITY_CATEGORIES

  const handleSelectTemplate = (template: ActivityTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setShowDetails(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-base-100 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-200">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-base-content/70 text-sm mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-base-200 space-y-4">
          {/* Search */}
          <div className="form-control">
            <div className="input-group">
              <span>
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาเทมเพลต..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
            >
              ทั้งหมด
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`btn btn-sm ${
                  selectedCategory === category.id ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory) && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost btn-sm"
              >
                <Filter className="w-4 h-4 mr-1" />
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
              <p className="text-base-content/70">
                {searchQuery ? `ไม่พบเทมเพลตสำหรับ "${searchQuery}"` : 'ไม่พบเทมเพลต'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card bg-base-100 border border-base-200 hover:border-primary cursor-pointer transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h3 className="font-semibold text-sm">{template.title}</h3>
                          <p className="text-xs text-base-content/70">
                            {template.category.name}
                          </p>
                        </div>
                      </div>
                      {template.defaultDuration && (
                        <div className="flex items-center gap-1 text-xs text-base-content/70">
                          <Clock className="w-3 h-3" />
                          {template.defaultDuration} นาที
                        </div>
                      )}
                    </div>

                    {template.description && (
                      <p className="text-xs text-base-content/80 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Required Fields */}
                    {template.requiredFields && template.requiredFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {template.requiredFields.slice(0, 3).map((field, index) => (
                          <span key={index} className="badge badge-outline badge-xs">
                            {field}
                          </span>
                        ))}
                        {template.requiredFields.length > 3 && (
                          <span className="badge badge-outline badge-xs">
                            +{template.requiredFields.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tips Preview */}
                    {template.tips && template.tips.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-base-content/70">
                        <Lightbulb className="w-3 h-3" />
                        <span>{template.tips.length} เคล็ดลับ</span>
                      </div>
                    )}

                    {/* Schedulable Badge */}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-1">
                        {template.isSchedulable && (
                          <span className="badge badge-success badge-xs">กำหนดการได้</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDetails(showDetails === template.id ? null : template.id)
                        }}
                        className="btn btn-ghost btn-xs"
                      >
                        รายละเอียด
                      </button>
                    </div>

                    {/* Details Expansion */}
                    <AnimatePresence>
                      {showDetails === template.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-base-200"
                        >
                          {template.tips && (
                            <div className="mb-2">
                              <p className="text-xs font-medium mb-1">เคล็ดลับ:</p>
                              <ul className="text-xs text-base-content/80 space-y-1">
                                {template.tips.map((tip, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="text-primary">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-200 flex justify-between items-center">
          <div className="text-sm text-base-content/70">
            {templates.length} เทมเพลต
            {schedulableOnly && ' (กำหนดการได้เท่านั้น)'}
          </div>
          <button onClick={onClose} className="btn btn-ghost">
            ปิด
          </button>
        </div>
      </motion.div>
    </div>
  )
}