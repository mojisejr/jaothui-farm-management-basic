import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

interface AnimalType {
  id: string
  name: string
}

interface Animal {
  id: string
  name: string
  microchip: string | null
  birthDate: string | null
  weight: number | null
  height: number | null
  color: string | null
  fatherName: string | null
  motherName: string | null
  notes: string | null
  photoUrl: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  animalType: AnimalType | null
}

interface AnimalDetail extends Animal {
  farm: {
    id: string
    name: string
    owner: {
      id: string
      name: string
    }
  }
  activities: Array<{
    id: string
    title: string
    description: string | null
    notes: string | null
    activityDate: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    createdAt: string
    updatedAt: string
  }>
  activitySchedules: Array<{
    id: string
    title: string
    description: string | null
    notes: string | null
    scheduledDate: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    isRecurring: boolean
    recurrenceType: string | null
    createdAt: string
    updatedAt: string
  }>
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

interface FetchAnimalsParams {
  farmId: string
  page?: number
  limit?: number
  search?: string
  animalTypeId?: string
}

interface FetchAnimalsResponse {
  animals: Animal[]
  animalTypes: AnimalType[]
  pagination: Pagination
}

const fetchFarmAnimals = async (
  params: FetchAnimalsParams,
): Promise<FetchAnimalsResponse> => {
  const { farmId, page = 1, limit = 12, search, animalTypeId } = params

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (search?.trim()) {
    searchParams.append('search', search.trim())
  }

  if (animalTypeId) {
    searchParams.append('animalTypeId', animalTypeId)
  }

  const response = await fetch(`/api/farm/${farmId}/animals?${searchParams}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถดึงข้อมูลสัตว์ได้')
  }

  return response.json()
}

export const useFarmAnimals = (params: FetchAnimalsParams) => {
  const queryKey = [
    'farm-animals',
    params.farmId,
    params.page,
    params.search,
    params.animalTypeId,
  ]

  return useQuery({
    queryKey,
    queryFn: () => fetchFarmAnimals(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.farmId,
  })
}

export const useInvalidateFarmAnimals = () => {
  const queryClient = useQueryClient()

  return (farmId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['farm-animals', farmId],
      exact: false,
    })
  }
}

// Fetch individual animal
const fetchAnimal = async (animalId: string): Promise<{ animal: AnimalDetail }> => {
  const response = await fetch(`/api/animal/${animalId}`)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถดึงข้อมูลสัตว์ได้')
  }
  
  return response.json()
}

// Hook for fetching individual animal
export const useAnimal = (animalId: string) => {
  return useQuery({
    queryKey: ['animal', animalId],
    queryFn: () => fetchAnimal(animalId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!animalId,
  })
}

// Hook for updating animal
export const useUpdateAnimal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ animalId, data }: { animalId: string; data: FormData | Record<string, unknown> }) => {
      const response = await fetch(`/api/animal/${animalId}`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ไม่สามารถอัพเดทข้อมูลสัตว์ได้')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch animal data
      queryClient.invalidateQueries({ queryKey: ['animal', variables.animalId] })
      
      // Invalidate farm animals list
      if (data.animal?.farm?.id) {
        queryClient.invalidateQueries({ queryKey: ['farm-animals', data.animal.farm.id] })
      }
    },
  })
}

// Hook for deleting animal
export const useDeleteAnimal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (animalId: string) => {
      const response = await fetch(`/api/animal/${animalId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ไม่สามารถลบข้อมูลสัตว์ได้')
      }
      
      return response.json()
    },
    onSuccess: (data, animalId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['animal', animalId] })
      
      // Invalidate farm animals list
      queryClient.invalidateQueries({ queryKey: ['farm-animals'] })
    },
  })
}

// Export types
export type {
  Animal,
  AnimalDetail,
  AnimalType,
  Pagination,
  FetchAnimalsParams,
  FetchAnimalsResponse,
}
