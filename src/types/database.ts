import { Prisma, ActivityStatus } from '@prisma/client'
import { z } from 'zod'

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

// AnimalType (simple interface based on schema)
export interface AnimalType {
  id: string
  name: string
  description?: string | null
}

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
  animalTypeId?: string
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

// Animal registration form types
export interface AnimalRegistrationForm {
  name: string
  animalTypeId: string
  microchip?: string
  birthDate?: Date
  weight?: number
  height?: number
  color?: string
  fatherName?: string
  motherName?: string
  notes?: string
  farmId: string
}

// Thai livestock types enum
export const THAI_LIVESTOCK_TYPES = [
  'หมู',
  'ไก่',
  'โค',
  'วัว',
  'ควาย',
  'ไก่ชน',
  'เป็ด',
  'ห่าน',
  'ไก่เนื้อ',
  'ไก่ไข่',
] as const

export type ThaiLivestockType = (typeof THAI_LIVESTOCK_TYPES)[number]

// Zod validation schemas
export const animalRegistrationSchema = z.object({
  name: z
    .string()
    .min(1, 'กรุณาระบุชื่อสัตว์')
    .min(2, 'ชื่อสัตว์ต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อสัตว์ต้องไม่เกิน 100 ตัวอักษร'),

  animalTypeId: z.string().min(1, 'กรุณาเลือกประเภทสัตว์'),

  microchip: z
    .string()
    .min(1, 'กรุณาระบุหรือสร้างไมโครชิป')
    .max(50, 'ไมโครชิปต้องไม่เกิน 50 ตัวอักษร'),

  birthDate: z
    .date({
      required_error: 'กรุณาระบุวันเกิดของสัตว์',
      invalid_type_error: 'วันเกิดไม่ถูกต้อง'
    })
    .refine((date) => {
      const today = new Date()
      const maxAge = new Date()
      maxAge.setFullYear(today.getFullYear() - 50) // สัตว์อายุไม่เกิน 50 ปี
      return date >= maxAge && date <= today
    }, 'วันเกิดต้องอยู่ในช่วง 50 ปีที่ผ่านมาถึงวันนี้'),

  weight: z
    .number()
    .positive('น้ำหนักต้องเป็นจำนวนบวก')
    .max(10000, 'น้ำหนักต้องไม่เกิน 10,000 กิโลกรัม')
    .optional(),

  height: z
    .number()
    .positive('ส่วนสูงต้องเป็นจำนวนบวก')
    .max(1000, 'ส่วนสูงต้องไม่เกิน 1,000 เซนติเมตร')
    .optional(),

  color: z
    .string()
    .max(50, 'สีต้องไม่เกิน 50 ตัวอักษร')
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  fatherName: z
    .string()
    .max(100, 'ชื่อพ่อพันธุ์ต้องไม่เกิน 100 ตัวอักษร')
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  motherName: z
    .string()
    .max(100, 'ชื่อแม่พันธุ์ต้องไม่เกิน 100 ตัวอักษร')
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  notes: z
    .string()
    .max(1000, 'บันทึกต้องไม่เกิน 1,000 ตัวอักษร')
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  farmId: z.string().min(1, 'ไม่พบข้อมูลฟาร์ม'),
})

export type AnimalRegistrationFormData = z.infer<
  typeof animalRegistrationSchema
>

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
