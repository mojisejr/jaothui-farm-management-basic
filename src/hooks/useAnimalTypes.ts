import { useQuery } from '@tanstack/react-query'

interface AnimalType {
  id: string
  name: string
  description: string | null
}

const fetchAnimalTypes = async (): Promise<AnimalType[]> => {
  const response = await fetch('/api/animal-types')

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถดึงข้อมูลประเภทสัตว์ได้')
  }

  const data = await response.json()
  return data.animalTypes || []
}

export const useAnimalTypes = () => {
  return useQuery({
    queryKey: ['animal-types'],
    queryFn: fetchAnimalTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes (rarely changes)
  })
}

// Export types
export type { AnimalType }
