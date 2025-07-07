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
  Repeat,
  CalendarDays,
  Tag,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  ACTIVITY_CATEGORIES, 
  getTemplatesByCategory,
  RECURRENCE_TYPES,
  type ActivityTemplate,
  type ActivityCategory
} from '@/constants/activity-templates'
import { ActivityTemplatePicker } from '@/components/ActivityTemplatePicker'

// Form validation schema
const scheduleSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อกิจกรรม').max(100, 'ชื่อกิจกรรมต้องไม่เกิน 100 ตัวอักษร'),
  description: z.string().max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร').optional(),
  notes: z.string().max(1000, 'บันทึกต้องไม่เกิน 1,000 ตัวอักษร').optional(),
  scheduledDate: z.date({
    required_error: 'กรุณาเลือกวันที่กำหนดกิจกรรม',
    invalid_type_error: 'รูปแบบวันที่ไม่ถูกต้อง'
  }).refine((date) => {
    const today = new Date()
    const maxFuture = new Date()
    maxFuture.setFullYear(today.getFullYear() + 2) // ไม่เกิน 2 ปีข้างหน้า
    return date >= today && date <= maxFuture
  }, 'วันที่ต้องเป็นอนาคตและไม่เกิน 2 ปีข้างหน้า'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  isRecurring: z.boolean(),
  recurrenceType: z.string().optional(),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่กิจกรรม'),
  templateId: z.string().optional(),
  customFields: z.record(z.string()).optional()
}).refine((data) => {
  // If recurring, recurrence type is required
  if (data.isRecurring && !data.recurrenceType) {
    return false
  }
  return true
}, {
  message: 'กรุณาเลือกรูปแบบการทำซ้ำ',
  path: ['recurrenceType']
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleFormProps {
  animalId: string | null
  farmId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ScheduleForm({ animalId, farmId: _farmId, onSuccess, onCancel }: ScheduleFormProps) {
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
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      status: 'PENDING',
      isRecurring: false,
      categoryId: '',
      customFields: {}
    }
  })

  const watchedCategoryId = watch('categoryId')
  const watchedTemplateId = watch('templateId')
  const watchedIsRecurring = watch('isRecurring')

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

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true)
    
    try {
      if (!animalId) {
        toast.error('ไม่พบข้อมูลสัตว์')
        return
      }

      const scheduleData = {
        title: data.title,
        description: data.description || undefined,
        notes: data.notes || undefined,
        scheduledDate: data.scheduledDate.toISOString(),
        status: data.status || 'PENDING',
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? data.recurrenceType : undefined,
        animalId: animalId,
        categoryId: data.categoryId,
        templateId: data.templateId || undefined,
        customFields: data.customFields || undefined
      }

      console.log('Schedule form data being sent:', JSON.stringify(scheduleData, null, 2))

      const response = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        
        // Display detailed error information
        if (errorData.details) {
          const errorMessages = errorData.details.map((detail: { message: string }) => detail.message).join(', ')
          throw new Error(`ข้อมูลไม่ถูกต้อง: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการสร้างกำหนดการ')
      }

      toast.success('สร้างกำหนดการสำเร็จ')
      onSuccess()
    } catch (error) {
      console.error('Schedule creation error:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างกำหนดการ')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render the form if animalId is missing
  if (!animalId) {
    return (
      <div className="alert alert-warning">
        <span>ไม่พบข้อมูลสัตว์ กรุณาเลือกสัตว์ก่อนสร้างกำหนดการ</span>
      </div>
    )
  }

  // const templatesForCategory = selectedCategory ? getTemplatesByCategory(selectedCategory.id).filter(t => t.isSchedulable) : []

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
                    className="btn btn-ghost btn-sm"
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
                  เลือกจากเทมเพลต (เฉพาะกำหนดการได้)
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

      {/* Scheduled Date */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            <Calendar className="w-4 h-4 inline mr-2" />
            วันที่กำหนดกิจกรรม <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="datetime-local"
          {...register('scheduledDate', {
            valueAsDate: true,
            setValueAs: (value) => value ? new Date(value) : undefined
          })}
          className={`input input-bordered w-full ${errors.scheduledDate ? 'input-error' : ''}`}
        />
        {errors.scheduledDate && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.scheduledDate.message}</span>
          </label>
        )}
      </div>

      {/* Recurring Schedule */}
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text font-medium">
            <Repeat className="w-4 h-4 inline mr-2" />
            กำหนดการซ้ำ
          </span>
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="checkbox checkbox-primary"
          />
        </label>
      </div>

      {/* Recurrence Type */}
      <AnimatePresence>
        {watchedIsRecurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="form-control"
          >
            <label className="label">
              <span className="label-text font-medium">
                <CalendarDays className="w-4 h-4 inline mr-2" />
                รูปแบบการทำซ้ำ <span className="text-error">*</span>
              </span>
            </label>
            <select
              {...register('recurrenceType')}
              className={`select select-bordered w-full ${errors.recurrenceType ? 'select-error' : ''}`}
            >
              <option value="">เลือกรูปแบบการทำซ้ำ</option>
              {RECURRENCE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
            {errors.recurrenceType && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.recurrenceType.message}</span>
              </label>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">สถานะ</span>
        </label>
        <select
          {...register('status')}
          className="select select-bordered w-full"
        >
          <option value="PENDING">รอดำเนินการ</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
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
          placeholder="บันทึกหมายเหตุหรือข้อมูลที่ต้องการจำ (ไม่บังคับ)"
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
          className="btn btn-ghost flex-1"
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
              กำลังสร้าง...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              สร้างกำหนดการ
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
        schedulableOnly={true}
        title="เลือกเทมเพลตกำหนดการ"
        subtitle="เลือกเทมเพลตที่เหมาะสมสำหรับการสร้างกำหนดการ (เฉพาะที่กำหนดการได้)"
      />
    </motion.form>
  )
}