import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Animal {
  id: string
  name: string
  animalType: {
    id: string
    name: string
  } | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  notes: string | null
  activityDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
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

interface FetchActivitiesParams {
  farmId: string
  page?: number
  limit?: number
  search?: string
  status?: string
}

interface FetchActivitiesResponse {
  activities: Activity[]
  statuses: StatusOption[]
  pagination: Pagination
}

const fetchFarmActivities = async (
  params: FetchActivitiesParams,
): Promise<FetchActivitiesResponse> => {
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

  const response = await fetch(`/api/farm/${farmId}/activities?${searchParams}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถดึงข้อมูลกิจกรรมได้')
  }

  return response.json()
}

export const useFarmActivities = (params: FetchActivitiesParams) => {
  const queryKey = [
    'farm-activities',
    params.farmId,
    params.page,
    params.search,
    params.status,
  ]

  return useQuery({
    queryKey,
    queryFn: () => fetchFarmActivities(params),
    staleTime: 3 * 60 * 1000, // 3 minutes (activities change more frequently)
    enabled: !!params.farmId,
  })
}

export const useInvalidateFarmActivities = () => {
  const queryClient = useQueryClient()

  return (farmId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['farm-activities', farmId],
      exact: false,
    })
  }
}

// Export types
export type {
  Activity,
  Animal,
  StatusOption,
  Pagination,
  FetchActivitiesParams,
  FetchActivitiesResponse,
}
