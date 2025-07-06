import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface Schedule {
  id: string
  title: string
  description: string | null
  notes: string | null
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRecurring: boolean
  recurrenceType: string | null
  createdAt: string
  animal: Animal
}

interface StatusOption {
  value: string
  label: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

interface FetchSchedulesParams {
  farmId: string
  page?: number
  limit?: number
  search?: string
  status?: string
}

interface FetchSchedulesResponse {
  schedules: Schedule[]
  statuses: StatusOption[]
  pagination: Pagination
}

const fetchFarmSchedules = async (
  params: FetchSchedulesParams,
): Promise<FetchSchedulesResponse> => {
  const { farmId, page = 1, limit = 10, search, status } = params

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (search?.trim()) {
    searchParams.append('search', search.trim())
  }

  if (status) {
    searchParams.append('status', status)
  }

  const response = await fetch(`/api/farm/${farmId}/schedules?${searchParams}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถดึงข้อมูลกำหนดการได้')
  }

  return response.json()
}

export const useFarmSchedules = (params: FetchSchedulesParams) => {
  const queryKey = [
    'farm-schedules',
    params.farmId,
    params.page,
    params.search,
    params.status,
  ]

  return useQuery({
    queryKey,
    queryFn: () => fetchFarmSchedules(params),
    staleTime: 3 * 60 * 1000, // 3 minutes (schedules change more frequently)
    enabled: !!params.farmId,
  })
}

export const useInvalidateFarmSchedules = () => {
  const queryClient = useQueryClient()

  return (farmId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['farm-schedules', farmId],
      exact: false,
    })
  }
}

// Export types
export type {
  Schedule,
  Animal,
  StatusOption,
  Pagination,
  FetchSchedulesParams,
  FetchSchedulesResponse,
}