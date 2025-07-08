'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  FileText,
  Check,
  Lightbulb,
  X,
  Tag,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  ACTIVITY_CATEGORIES, 
  getTemplatesByCategory,
  type ActivityTemplate,
  type ActivityCategory 
} from '@/constants/activity-templates'
import { ActivityTemplatePicker } from '@/components/ActivityTemplatePicker'

// Form validation schema
const activitySchema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อกิจกรรม').max(100, 'ชื่อกิจกรรมต้องไม่เกิน 100 ตัวอักษร'),
  description: z.string().max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร').optional(),
  notes: z.string().max(1000, 'บันทึกต้องไม่เกิน 1,000 ตัวอักษร').optional(),
  activityDate: z.date({
    required_error: 'กรุณาเลือกวันที่ทำกิจกรรม',
    invalid_type_error: 'รูปแบบวันที่ไม่ถูกต้อง'
  }).refine((date) => {
    const today = new Date()
    const maxPast = new Date()
    maxPast.setFullYear(today.getFullYear() - 1) // ไม่เกิน 1 ปีที่แล้ว
    return date >= maxPast && date <= today
  }, 'วันที่ต้องไม่เกิน 1 ปีที่แล้วและไม่เกินวันนี้'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่กิจกรรม'),
  templateId: z.string().optional(),
  customFields: z.record(z.string()).optional()
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
  animalId: string
  farmId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ActivityForm({ animalId, farmId: _farmId, onSuccess, onCancel }: ActivityFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [customFields, setCustomFields] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      status: 'COMPLETED',
      activityDate: new Date(),
      categoryId: '',
      customFields: {}
    }
  })

  const watchedCategoryId = watch('categoryId')
  const watchedTemplateId = watch('templateId')

  // Update selected category when form changes
  useEffect(() => {
    if (watchedCategoryId) {
      const category = ACTIVITY_CATEGORIES.find(cat => cat.id === watchedCategoryId)
      setSelectedCategory(category || null)
      setShowTemplates(true)
      // Reset template when category changes
      setValue('templateId', '')
      setSelectedTemplate(null)
    } else {
      setSelectedCategory(null)
      setShowTemplates(false)
    }
  }, [watchedCategoryId, setValue])

  // Update selected template when form changes
  useEffect(() => {
    if (watchedTemplateId && selectedCategory) {
      const template = getTemplatesByCategory(selectedCategory.id).find(t => t.id === watchedTemplateId)
      if (template) {
        setSelectedTemplate(template)
        setValue('title', template.title)
        setValue('description', template.description || '')
        
        // Initialize custom fields for required fields
        if (template.requiredFields) {
          const newCustomFields: Record<string, string> = {}
          template.requiredFields.forEach(field => {
            newCustomFields[field] = ''
          })
          setCustomFields(newCustomFields)
          setValue('customFields', newCustomFields)
        }
      }
    } else {
      setSelectedTemplate(null)
      setCustomFields({})
    }
  }, [watchedTemplateId, selectedCategory, setValue])

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    const newCustomFields = { ...customFields, [fieldName]: value }
    setCustomFields(newCustomFields)
    setValue('customFields', newCustomFields)
  }

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true)
    
    try {
      const activityData = {
        title: data.title,
        description: data.description,
        notes: data.notes,
        activityDate: data.activityDate.toISOString(),
        status: data.status,
        animalId,
        customFields: data.customFields
      }

      const response = await fetch('/api/activity/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม')
      }

      toast.success('บันทึกกิจกรรมสำเร็จ')
      onSuccess()
    } catch (error) {
      console.error('Activity creation error:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม')
    } finally {
      setIsSubmitting(false)
    }
  }

  // const templatesForCategory = selectedCategory ? getTemplatesByCategory(selectedCategory.id) : []

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Category Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            <Tag className="w-4 h-4 inline mr-2" />
            หมวดหมู่กิจกรรม <span className="text-error">*</span>
          </span>
        </label>
        <select
          {...register('categoryId')}
          className={`select select-bordered w-full ${errors.categoryId ? 'select-error' : ''}`}
        >
          <option value="">เลือกหมวดหมู่กิจกรรม</option>
          {ACTIVITY_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.categoryId.message}</span>
          </label>
        )}
      </div>

      {/* Template Selection */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="form-control"
          >
            <label className="label">
              <span className="label-text font-medium">
                <FileText className="w-4 h-4 inline mr-2" />
                เทมเพลตกิจกรรม
              </span>
            </label>
            <div className="space-y-2">
              {selectedTemplate ? (
                <div className="alert alert-success">
                  <Check className="w-5 h-5" />
                  <div>
                    <div className="font-bold">เลือกแล้ว: {selectedTemplate.title}</div>
                    <div className="text-sm">{selectedTemplate.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null)
                      setValue('templateId', '')
                      setValue('title', '')
                      setValue('description', '')
                      setCustomFields({})
                    }}
                    className="btn btn-ghost btn-sm text-black"
                  >
                    <X className="w-4 h-4" />
                    เปลี่ยน
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(true)}
                  className="btn btn-outline w-full justify-start"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  เลือกจากเทมเพลต
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Tips */}
      <AnimatePresence>
        {selectedTemplate && selectedTemplate.tips && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="alert alert-info"
          >
            <Lightbulb className="w-5 h-5" />
            <div>
              <h3 className="font-bold">เคล็ดลับ:</h3>
              <ul className="list-disc list-inside text-sm mt-1">
                {selectedTemplate.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Title */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            ชื่อกิจกรรม <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          {...register('title')}
          className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
          placeholder="ระบุชื่อกิจกรรม"
        />
        {errors.title && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.title.message}</span>
          </label>
        )}
      </div>

      {/* Activity Date */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            <Calendar className="w-4 h-4 inline mr-2" />
            วันที่ทำกิจกรรม <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="datetime-local"
          {...register('activityDate', {
            valueAsDate: true,
            setValueAs: (value) => value ? new Date(value) : undefined
          })}
          className={`input input-bordered w-full ${errors.activityDate ? 'input-error' : ''}`}
        />
        {errors.activityDate && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.activityDate.message}</span>
          </label>
        )}
      </div>

      {/* Status */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">สถานะ</span>
        </label>
        <select
          {...register('status')}
          className="select select-bordered w-full"
        >
          <option value="COMPLETED">เสร็จสิ้น</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="PENDING">รอดำเนินการ</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>

      {/* Custom Fields */}
      <AnimatePresence>
        {selectedTemplate && selectedTemplate.requiredFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">ข้อมูลเพิ่มเติม</h3>
            {selectedTemplate.requiredFields.map((fieldName) => (
              <div key={fieldName} className="form-control">
                <label className="label">
                  <span className="label-text font-medium capitalize">
                    {fieldName} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={customFields[fieldName] || ''}
                  onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                  className="input input-bordered w-full"
                  placeholder={`ระบุ${fieldName}`}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">รายละเอียด</span>
        </label>
        <textarea
          {...register('description')}
          className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`}
          placeholder="ระบุรายละเอียดกิจกรรม (ไม่บังคับ)"
        />
        {errors.description && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.description.message}</span>
          </label>
        )}
      </div>

      {/* Notes */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">บันทึกเพิ่มเติม</span>
        </label>
        <textarea
          {...register('notes')}
          className={`textarea textarea-bordered h-32 ${errors.notes ? 'textarea-error' : ''}`}
          placeholder="บันทึกผลการทำกิจกรรม หมายเหตุ หรือสิ่งที่สังเกตได้ (ไม่บังคับ)"
        />
        {errors.notes && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.notes.message}</span>
          </label>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost flex-1 text-black"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          ยกเลิก
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              บันทึกกิจกรรม
            </>
          )}
        </button>
      </div>

      {/* Activity Template Picker Modal */}
      <ActivityTemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template)
          setValue('templateId', template.id)
          setValue('title', template.title)
          setValue('description', template.description || '')
          
          // Initialize custom fields for required fields
          if (template.requiredFields) {
            const newCustomFields: Record<string, string> = {}
            template.requiredFields.forEach(field => {
              newCustomFields[field] = ''
            })
            setCustomFields(newCustomFields)
            setValue('customFields', newCustomFields)
          }
        }}
        selectedCategoryId={selectedCategory?.id}
        title="เลือกเทมเพลตกิจกรรม"
        subtitle="เลือกเทมเพลตที่เหมาะสมสำหรับการบันทึกกิจกรรม"
      />
    </motion.form>
  )
}