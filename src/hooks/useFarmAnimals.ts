import { useQuery, useQueryClient } from '@tanstack/react-query'

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
  image: string | null
  createdAt: string
  animalType: AnimalType | null
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

// Export types
export type {
  Animal,
  AnimalType,
  Pagination,
  FetchAnimalsParams,
  FetchAnimalsResponse,
}
