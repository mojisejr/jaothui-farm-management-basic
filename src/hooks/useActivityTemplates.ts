'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  ACTIVITY_TEMPLATES, 
  ACTIVITY_CATEGORIES,
  type ActivityTemplate,
  type ActivityCategory,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  getSchedulableTemplates,
  getTemplateStatistics
} from '@/constants/activity-templates'

interface UseActivityTemplatesOptions {
  categoryId?: string
  schedulableOnly?: boolean
  maxDuration?: number
  search?: string
  includeStats?: boolean
  enabled?: boolean
}

interface TemplatesResponse {
  templates: ActivityTemplate[]
  categories: ActivityCategory[]
  count: number
  statistics?: ReturnType<typeof getTemplateStatistics>
}

// Hook สำหรับดึง templates ทั้งหมดหรือตามเงื่อนไข
export function useActivityTemplates(options: UseActivityTemplatesOptions = {}) {
  const {
    categoryId,
    schedulableOnly = false,
    maxDuration,
    search,
    includeStats = false,
    enabled = true
  } = options

  return useQuery<TemplatesResponse>({
    queryKey: ['activity-templates', { categoryId, schedulableOnly, maxDuration, search, includeStats }],
    queryFn: async () => {
      // For static data, we can process it client-side instead of API call
      let templates = ACTIVITY_TEMPLATES

      // Apply filters
      if (categoryId) {
        templates = getTemplatesByCategory(categoryId)
      }

      if (schedulableOnly) {
        templates = templates.filter(t => t.isSchedulable)
      }

      if (maxDuration) {
        templates = templates.filter(t => 
          t.defaultDuration && t.defaultDuration <= maxDuration
        )
      }

      if (search) {
        templates = searchTemplates(search)
      }

      const response: TemplatesResponse = {
        templates,
        categories: ACTIVITY_CATEGORIES,
        count: templates.length
      }

      if (includeStats) {
        response.statistics = getTemplateStatistics()
      }

      return response
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (templates don't change often)
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Hook สำหรับดึง template เดียว
export function useActivityTemplate(templateId: string, enabled: boolean = true) {
  return useQuery<ActivityTemplate | null>({
    queryKey: ['activity-template', templateId],
    queryFn: async () => {
      const template = getTemplateById(templateId)
      return template || null
    },
    enabled: enabled && !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000 // 15 minutes
  })
}

// Hook สำหรับดึง templates ตาม category
export function useTemplatesByCategory(categoryId: string, enabled: boolean = true) {
  return useQuery<ActivityTemplate[]>({
    queryKey: ['templates-by-category', categoryId],
    queryFn: async () => {
      return getTemplatesByCategory(categoryId)
    },
    enabled: enabled && !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Hook สำหรับดึง schedulable templates เท่านั้น
export function useSchedulableTemplates(enabled: boolean = true) {
  return useQuery<ActivityTemplate[]>({
    queryKey: ['schedulable-templates'],
    queryFn: async () => {
      return getSchedulableTemplates()
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Hook สำหรับ search templates
export function useSearchTemplates(query: string, enabled: boolean = true) {
  return useQuery<ActivityTemplate[]>({
    queryKey: ['search-templates', query],
    queryFn: async () => {
      if (!query.trim()) return []
      return searchTemplates(query)
    },
    enabled: enabled && !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000
  })
}

// Hook สำหรับ template statistics
export function useTemplateStatistics(enabled: boolean = true) {
  return useQuery({
    queryKey: ['template-statistics'],
    queryFn: async () => {
      return getTemplateStatistics()
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })
}