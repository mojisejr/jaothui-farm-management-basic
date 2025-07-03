'use client'

import { AnimalCreateForm } from '@/components/forms/AnimalCreateForm'
import { useRouter } from 'next/navigation'

interface Props {
  farmId: string
}

export function AnimalCreateFormWrapper({ farmId }: Props) {
  const router = useRouter()

  return (
    <AnimalCreateForm
      farmId={farmId}
      onSuccess={(animalId) => {
        router.push(
          `/farm/${farmId}?success=animal-created&animalId=${animalId}`,
        )
      }}
    />
  )
}
