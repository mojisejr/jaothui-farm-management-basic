// Farm authorization utilities
import { PrismaClient, Farm, Profile } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export interface AuthResult {
  success: boolean
  userId?: string
  error?: string
  status?: number
}

/**
 * ตรวจสอบ authentication จาก cookies
 */
export async function authenticateUser(): Promise<AuthResult> {
  try {
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบ',
        status: 401,
      }
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return {
        success: false,
        error: 'โทเค็นไม่ถูกต้อง',
        status: 401,
      }
    }

    return {
      success: true,
      userId: tokenPayload.userId,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ',
      status: 500,
    }
  }
}

type FarmWithOwner = Farm & {
  owner: Pick<Profile, 'id' | 'firstName' | 'lastName' | 'phoneNumber'>
}

export interface FarmAuthResult {
  success: boolean
  farm?: FarmWithOwner | Farm
  isOwner?: boolean
  isMember?: boolean
  error?: string
  status?: number
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึงฟาร์ม (เจ้าของหรือสมาชิก)
 */
export async function checkFarmAccess(
  farmId: string,
  userId: string,
): Promise<FarmAuthResult> {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    })

    if (!farm) {
      return {
        success: false,
        error: 'ไม่พบฟาร์มที่ระบุ',
        status: 404,
      }
    }

    const isOwner = farm.ownerId === userId
    const isMember = await prisma.farmMember.findFirst({
      where: {
        farmId: farm.id,
        profileId: userId,
      },
    })

    if (!isOwner && !isMember) {
      return {
        success: false,
        error: 'คุณไม่มีสิทธิ์เข้าถึงฟาร์มนี้',
        status: 403,
      }
    }

    return {
      success: true,
      farm,
      isOwner,
      isMember: !!isMember,
    }
  } catch (error) {
    console.error('Farm access check error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์เข้าถึงฟาร์ม',
      status: 500,
    }
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * ตรวจสอบความเป็นเจ้าของฟาร์ม (เฉพาะเจ้าของเท่านั้น)
 */
export async function checkFarmOwnership(
  farmId: string,
  userId: string,
): Promise<FarmAuthResult> {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    })

    if (!farm) {
      return {
        success: false,
        error: 'ไม่พบฟาร์มที่ระบุ',
        status: 404,
      }
    }

    if (farm.ownerId !== userId) {
      return {
        success: false,
        error: 'คุณไม่มีสิทธิ์จัดการฟาร์มนี้ (เฉพาะเจ้าของเท่านั้น)',
        status: 403,
      }
    }

    return {
      success: true,
      farm,
      isOwner: true,
      isMember: false,
    }
  } catch (error) {
    console.error('Farm ownership check error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบความเป็นเจ้าของฟาร์ม',
      status: 500,
    }
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * ตรวจสอบข้อมูลที่เกี่ยวข้องก่อนลบฟาร์ม
 */
export async function checkFarmDeletionConstraints(
  farmId: string,
): Promise<{ canDelete: boolean; error?: string }> {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            animals: true,
            members: true,
          },
        },
      },
    })

    if (!farm) {
      return { canDelete: false, error: 'ไม่พบฟาร์มที่ระบุ' }
    }

    if (farm._count.animals > 0) {
      return {
        canDelete: false,
        error: `ไม่สามารถลบฟาร์มได้เนื่องจากมีสัตว์ ${farm._count.animals} ตัว กรุณาลบสัตว์ทั้งหมดก่อน`,
      }
    }

    if (farm._count.members > 0) {
      return {
        canDelete: false,
        error: `ไม่สามารถลบฟาร์มได้เนื่องจากมีสมาชิก ${farm._count.members} คน กรุณาลบสมาชิกทั้งหมดก่อน`,
      }
    }

    return { canDelete: true }
  } catch (error) {
    console.error('Farm deletion constraints check error:', error)
    return {
      canDelete: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลที่เกี่ยวข้อง',
    }
  } finally {
    await prisma.$disconnect()
  }
}
