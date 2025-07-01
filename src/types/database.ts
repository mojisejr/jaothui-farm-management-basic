import { Prisma, ActivityStatus } from '@prisma/client'

// Profile types
export type Profile = Prisma.ProfileGetPayload<Record<string, never>>
export type ProfileWithFarms = Prisma.ProfileGetPayload<{
  include: {
    ownedFarms: true
    memberOfFarms: {
      include: {
        farm: true
      }
    }
  }
}>

// Farm types
export type Farm = Prisma.FarmGetPayload<Record<string, never>>
export type FarmWithOwner = Prisma.FarmGetPayload<{
  include: {
    owner: true
  }
}>
export type FarmWithMembers = Prisma.FarmGetPayload<{
  include: {
    owner: true
    members: {
      include: {
        profile: true
      }
    }
  }
}>
export type FarmWithAnimals = Prisma.FarmGetPayload<{
  include: {
    animals: true
  }
}>
export type FarmComplete = Prisma.FarmGetPayload<{
  include: {
    owner: true
    members: {
      include: {
        profile: true
      }
    }
    animals: true
  }
}>

// Animal types
export type Animal = Prisma.AnimalGetPayload<Record<string, never>>
export type AnimalWithFarm = Prisma.AnimalGetPayload<{
  include: {
    farm: {
      include: {
        owner: true
      }
    }
  }
}>
export type AnimalWithActivities = Prisma.AnimalGetPayload<{
  include: {
    activities: true
    activitySchedules: true
  }
}>
export type AnimalComplete = Prisma.AnimalGetPayload<{
  include: {
    farm: {
      include: {
        owner: true
      }
    }
    activities: true
    activitySchedules: true
  }
}>

// Activity types
export type Activity = Prisma.ActivityGetPayload<Record<string, never>>
export type ActivityWithAnimal = Prisma.ActivityGetPayload<{
  include: {
    animal: {
      include: {
        farm: true
      }
    }
  }
}>

// Activity Schedule types
export type ActivitySchedule = Prisma.ActivityScheduleGetPayload<
  Record<string, never>
>
export type ActivityScheduleWithAnimal = Prisma.ActivityScheduleGetPayload<{
  include: {
    animal: {
      include: {
        farm: true
      }
    }
  }
}>

// Farm Member types
export type FarmMember = Prisma.FarmMemberGetPayload<Record<string, never>>
export type FarmMemberWithProfile = Prisma.FarmMemberGetPayload<{
  include: {
    profile: true
  }
}>
export type FarmMemberWithFarm = Prisma.FarmMemberGetPayload<{
  include: {
    farm: true
  }
}>

// Create input types
export type CreateProfileInput = Prisma.ProfileCreateInput
export type CreateFarmInput = Prisma.FarmCreateInput
export type CreateAnimalInput = Prisma.AnimalCreateInput
export type CreateActivityInput = Prisma.ActivityCreateInput
export type CreateActivityScheduleInput = Prisma.ActivityScheduleCreateInput

// Update input types
export type UpdateProfileInput = Prisma.ProfileUpdateInput
export type UpdateFarmInput = Prisma.FarmUpdateInput
export type UpdateAnimalInput = Prisma.AnimalUpdateInput
export type UpdateActivityInput = Prisma.ActivityUpdateInput
export type UpdateActivityScheduleInput = Prisma.ActivityScheduleUpdateInput

// Enum types
export { ActivityStatus }

// Search and filter types
export interface AnimalFilters {
  farmId?: string
  animalType?: string
  name?: string
  microchip?: string
}

export interface ActivityFilters {
  animalId?: string
  status?: ActivityStatus
  dateFrom?: Date
  dateTo?: Date
}

export interface FarmFilters {
  ownerId?: string
  province?: string
  name?: string
}

// Pagination types
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}
