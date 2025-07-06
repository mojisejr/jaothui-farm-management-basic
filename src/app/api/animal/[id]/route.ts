import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { COOKIE } from '@/constants/cookies'
import { ANIMAL_PHOTOS_BUCKET } from '@/constants/storage'
import { uploadToStorage, generateUniqueFilename, deleteFromStorage, extractStoragePath } from '@/lib/supabase/storage'
import prisma from '@/lib/prisma'

// GET /api/animal/[id] - Get single animal details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE.ACCESS)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      )
    }

    // Find animal and verify access
    const animal = await prisma.animal.findFirst({
      where: {
        id,
        farm: {
          OR: [
            { ownerId: payload.userId },
            {
              members: {
                some: {
                  profileId: payload.userId,
                },
              },
            },
          ],
        },
      },
      include: {
        animalType: true,
        farm: {
          include: {
            owner: true,
          },
        },
        activities: {
          orderBy: {
            activityDate: 'desc',
          },
          take: 20, // Get more activities for history
        },
        activitySchedules: {
          orderBy: {
            scheduledDate: 'desc',
          },
          take: 20, // Get scheduled activities
        },
      },
    })

    if (!animal) {
      return NextResponse.json(
        { error: 'ไม่พบสัตว์หรือคุณไม่มีสิทธิ์เข้าถึง' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      animal: {
        id: animal.id,
        name: animal.name,
        microchip: animal.microchip,
        animalType: animal.animalType,
        birthDate: animal.birthDate,
        weight: animal.weight,
        height: animal.height,
        color: animal.color,
        fatherName: animal.fatherName,
        motherName: animal.motherName,
        notes: animal.notes,
        photoUrl: animal.photoUrl,
        createdAt: animal.createdAt,
        updatedAt: animal.updatedAt,
        farm: {
          id: animal.farm.id,
          name: animal.farm.name,
          owner: animal.farm.owner,
        },
        activities: animal.activities,
        activitySchedules: animal.activitySchedules,
      },
    })
  } catch (error) {
    console.error('Error fetching animal:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// PUT /api/animal/[id] - Update animal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE.ACCESS)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      )
    }

    // Check if request contains FormData (with image) or JSON
    const contentType = request.headers.get('content-type')
    let body: Record<string, unknown> = {}
    let imageFile: File | null = null

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData()
      imageFile = formData.get('image') as File | null
      
      // Convert FormData to object
      body = {
        name: formData.get('name') as string,
        animalTypeId: formData.get('animalTypeId') as string,
        microchip: formData.get('microchip') as string | null,
        birthDate: formData.get('birthDate') ? new Date(formData.get('birthDate') as string) : undefined,
        weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : undefined,
        height: formData.get('height') ? parseFloat(formData.get('height') as string) : undefined,
        color: formData.get('color') as string | null,
        fatherName: formData.get('fatherName') as string | null,
        motherName: formData.get('motherName') as string | null,
        notes: formData.get('notes') as string | null,
      }
    } else {
      // Handle JSON
      body = await request.json()
    }

    // Validate image if provided
    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'ไฟล์ต้องเป็นรูปภาพ' },
          { status: 400 }
        )
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' },
          { status: 400 }
        )
      }
    }

    // Find existing animal and verify access
    const existingAnimal = await prisma.animal.findFirst({
      where: {
        id,
        farm: {
          OR: [
            { ownerId: payload.userId },
            {
              members: {
                some: {
                  profileId: payload.userId,
                },
              },
            },
          ],
        },
      },
    })

    if (!existingAnimal) {
      return NextResponse.json(
        { error: 'ไม่พบสัตว์หรือคุณไม่มีสิทธิ์เข้าถึง' },
        { status: 404 }
      )
    }

    // Check if microchip is being changed and if it's unique
    if (body.microchip && body.microchip !== existingAnimal.microchip) {
      const existingMicrochip = await prisma.animal.findFirst({
        where: {
          microchip: body.microchip,
          NOT: { id },
        },
      })

      if (existingMicrochip) {
        return NextResponse.json(
          { error: 'ไมโครชิปนี้มีการใช้งานแล้ว' },
          { status: 409 }
        )
      }
    }

    // Handle image upload if new image provided
    let photoUrl = existingAnimal.photoUrl
    if (imageFile) {
      // Delete old image if exists
      if (existingAnimal.photoUrl) {
        const oldImagePath = extractStoragePath(existingAnimal.photoUrl, ANIMAL_PHOTOS_BUCKET)
        if (oldImagePath) {
          await deleteFromStorage(ANIMAL_PHOTOS_BUCKET, oldImagePath)
        }
      }

      // Upload new image
      const imagePath = generateUniqueFilename(payload.userId, imageFile.name)
      const imageUploadResult = await uploadToStorage(
        ANIMAL_PHOTOS_BUCKET,
        imagePath,
        imageFile
      )

      if (!imageUploadResult.success) {
        return NextResponse.json(
          { error: imageUploadResult.error || 'ไม่สามารถอัปโหลดรูปภาพได้' },
          { status: 500 }
        )
      }

      photoUrl = imageUploadResult.url || null
    }

    // Update animal record
    const updatedAnimal = await prisma.animal.update({
      where: { id },
      data: {
        name: body.name || existingAnimal.name,
        animalTypeId: body.animalTypeId || existingAnimal.animalTypeId,
        microchip: body.microchip || existingAnimal.microchip,
        birthDate: body.birthDate !== undefined ? body.birthDate : existingAnimal.birthDate,
        weight: body.weight !== undefined ? body.weight : existingAnimal.weight,
        height: body.height !== undefined ? body.height : existingAnimal.height,
        color: body.color !== undefined ? body.color : existingAnimal.color,
        fatherName: body.fatherName !== undefined ? body.fatherName : existingAnimal.fatherName,
        motherName: body.motherName !== undefined ? body.motherName : existingAnimal.motherName,
        notes: body.notes !== undefined ? body.notes : existingAnimal.notes,
        photoUrl,
      },
      include: {
        animalType: true,
        farm: {
          include: {
            owner: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'อัพเดทข้อมูลสัตว์สำเร็จ',
      animal: {
        id: updatedAnimal.id,
        name: updatedAnimal.name,
        microchip: updatedAnimal.microchip,
        animalType: updatedAnimal.animalType,
        birthDate: updatedAnimal.birthDate,
        weight: updatedAnimal.weight,
        height: updatedAnimal.height,
        color: updatedAnimal.color,
        fatherName: updatedAnimal.fatherName,
        motherName: updatedAnimal.motherName,
        notes: updatedAnimal.notes,
        photoUrl: updatedAnimal.photoUrl,
        createdAt: updatedAnimal.createdAt,
        updatedAt: updatedAnimal.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating animal:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// DELETE /api/animal/[id] - Delete animal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE.ACCESS)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      )
    }

    // Find animal and verify access (only owner can delete)
    const animal = await prisma.animal.findFirst({
      where: {
        id,
        farm: {
          ownerId: payload.userId, // Only farm owner can delete animals
        },
      },
    })

    if (!animal) {
      return NextResponse.json(
        { error: 'ไม่พบสัตว์หรือคุณไม่มีสิทธิ์ลบสัตว์นี้' },
        { status: 404 }
      )
    }

    // Delete image from storage if exists
    if (animal.photoUrl) {
      const imagePath = extractStoragePath(animal.photoUrl, ANIMAL_PHOTOS_BUCKET)
      if (imagePath) {
        await deleteFromStorage(ANIMAL_PHOTOS_BUCKET, imagePath)
      }
    }

    // Delete animal record
    await prisma.animal.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'ลบข้อมูลสัตว์สำเร็จ',
    })
  } catch (error) {
    console.error('Error deleting animal:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}