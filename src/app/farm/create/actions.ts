'use server'

import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { farmCreateSchema } from '@/types/farm'

const prisma = new PrismaClient()

export async function createFarm(
  prevState: { message: string },
  formData: FormData,
) {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      redirect('/login')
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      redirect('/login')
    }

    // Find the user's profile
    const profile = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        ownedFarms: {
          select: { id: true },
        },
      },
    })

    if (!profile) {
      return { message: 'ไม่พบข้อมูลโปรไฟล์ของผู้ใช้' }
    }

    // Check if user already owns a farm
    if (profile.ownedFarms.length > 0) {
      return {
        message: 'คุณเป็นเจ้าของฟาร์มอยู่แล้ว ไม่สามารถสร้างฟาร์มใหม่ได้',
      }
    }

    // Get form data
    const name = formData.get('name') as string
    const province = formData.get('province') as string
    const sizeStr = formData.get('size') as string
    const description = formData.get('description') as string

    // Convert size to number
    const size = sizeStr ? parseFloat(sizeStr) : undefined

    // Zod validation
    const parsed = farmCreateSchema.safeParse({
      name,
      province,
      size,
      description: description || undefined,
    })

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง'
      return { message: firstError }
    }

    const validatedData = parsed.data

    // Create new farm
    const newFarm = await prisma.farm.create({
      data: {
        name: validatedData.name,
        province: validatedData.province,
        size: validatedData.size,
        description: validatedData.description,
        ownerId: profile.id,
      },
    })

    revalidatePath('/farm') // Revalidate potential farm list page
    redirect(`/farm/${newFarm.id}`) // Redirect to the new farm's page
  } catch (error) {
    console.error('Error creating farm:', error)
    return {
      message: 'เกิดข้อผิดพลาดในการสร้างฟาร์ม โปรดลองใหม่อีกครั้ง',
    }
  } finally {
    await prisma.$disconnect()
  }
}
