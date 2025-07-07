'use server'

import { PrismaClient } from '@prisma/client'
import { getAccessTokenFromCookies, verifyAccessToken } from '@/lib/jwt'
import {
  uploadToStorage,
  deleteFromStorage,
  extractStoragePath,
  generateUniqueFilename,
} from '@/lib/supabase/storage'
import { processFileUpload } from '@/lib/file-security'
import { revalidatePath } from 'next/cache'
// Removed unused import: redirect

const prisma = new PrismaClient()

export type UpdateProfileResult = {
  success?: boolean
  error?: string
}

export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่' }
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return { error: 'โทเค็นไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' }
    }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const _phoneNumber = formData.get('phoneNumber') as string // Not updatable - login identifier
    const profileImageFile = formData.get('profileImage') as File

    // Validate required fields
    if (!firstName || !lastName) {
      return { error: 'กรุณากรอกชื่อและนามสกุล' }
    }

    // Get current profile data
    const currentProfile = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
      select: { profileImage: true },
    })

    if (!currentProfile) {
      return { error: 'ไม่พบข้อมูลโปรไฟล์' }
    }

    let profileImageUrl = currentProfile.profileImage

    // Handle profile image upload
    if (profileImageFile && profileImageFile.size > 0) {
      // Validate and process file upload for security
      const fileValidation = await processFileUpload(profileImageFile, tokenPayload.userId)
      
      if (!fileValidation.isValid) {
        return { error: fileValidation.error }
      }

      const validatedFile = fileValidation.processedFile!
      const secureFilename = fileValidation.filename!

      // Delete old profile image if exists
      if (currentProfile.profileImage) {
        const oldPath = extractStoragePath(
          currentProfile.profileImage,
          'profile-images',
        )
        if (oldPath) {
          await deleteFromStorage('profile-images', oldPath)
        }
      }

      // Upload new validated profile image
      const fileName = generateUniqueFilename(
        tokenPayload.userId,
        secureFilename,
      )
      const uploadResult = await uploadToStorage(
        'profile-images',
        fileName,
        validatedFile,
      )

      if (!uploadResult.success) {
        return { error: uploadResult.error || 'ไม่สามารถอัปโหลดรูปภาพได้' }
      }

      profileImageUrl = uploadResult.url || null
    }

    // Update profile in database
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profileImage: profileImageUrl ?? null,
      // Note: phoneNumber should not be updated as it's the login identifier
    }

    await prisma.profile.update({
      where: { id: tokenPayload.userId },
      data: updateData,
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' }
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteProfileImage(): Promise<UpdateProfileResult> {
  try {
    // Get and verify access token
    const accessToken = await getAccessTokenFromCookies()
    if (!accessToken) {
      return { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่' }
    }

    const tokenPayload = verifyAccessToken(accessToken)
    if (!tokenPayload) {
      return { error: 'โทเค็นไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' }
    }

    // Get current profile data
    const currentProfile = await prisma.profile.findUnique({
      where: { id: tokenPayload.userId },
      select: { profileImage: true },
    })

    if (!currentProfile) {
      return { error: 'ไม่พบข้อมูลโปรไฟล์' }
    }

    // Delete profile image from storage if exists
    if (currentProfile.profileImage) {
      const imagePath = extractStoragePath(
        currentProfile.profileImage,
        'profile-images',
      )
      if (imagePath) {
        await deleteFromStorage('profile-images', imagePath)
      }
    }

    // Update profile in database
    await prisma.profile.update({
      where: { id: tokenPayload.userId },
      data: { profileImage: null },
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Delete profile image error:', error)
    return { error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' }
  } finally {
    await prisma.$disconnect()
  }
}
