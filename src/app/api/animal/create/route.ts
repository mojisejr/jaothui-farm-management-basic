import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { animalRegistrationSchema } from '@/types/database'
import { generateMicrochip } from '@/lib/microchip'
import { COOKIE } from '@/constants/cookies'
import { ANIMAL_PHOTOS_BUCKET } from '@/constants/storage'
import { uploadToStorage, generateUniqueFilename } from '@/lib/supabase/storage'
import { processFileUpload } from '@/lib/file-security'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE.ACCESS)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 },
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 },
      )
    }

    // Parse FormData from request
    const formData = await request.formData()
    
    // Extract image file
    const imageFile = formData.get('image') as File | null
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'กรุณาเลือกรูปภาพสัตว์' },
        { status: 400 },
      )
    }

    // Comprehensive file security validation
    const fileValidation = await processFileUpload(imageFile, payload.userId)
    
    if (!fileValidation.isValid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 },
      )
    }

    const validatedFile = fileValidation.processedFile!
    const secureFilename = fileValidation.filename!

    // Convert FormData to object for validation
    const body = {
      farmId: formData.get('farmId') as string,
      name: formData.get('name') as string,
      animalTypeId: formData.get('animalTypeId') as string,
      microchip: formData.get('microchip') as string,
      birthDate: new Date(formData.get('birthDate') as string),
      weight: formData.get('weight') ? parseInt(formData.get('weight') as string) : undefined,
      height: formData.get('height') ? parseInt(formData.get('height') as string) : undefined,
      color: formData.get('color') ? formData.get('color') as string : undefined,
      fatherName: formData.get('fatherName') ? formData.get('fatherName') as string : undefined,
      motherName: formData.get('motherName') ? formData.get('motherName') as string : undefined,
      notes: formData.get('notes') ? formData.get('notes') as string : undefined,
    }

    // Validate the form data
    const validationResult = animalRegistrationSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.flatten()
      console.error('Validation errors:', {
        body,
        errors: errors.fieldErrors,
        formErrors: errors.formErrors
      })
      return NextResponse.json(
        {
          error: 'ข้อมูลไม่ถูกต้อง',
          details: errors.fieldErrors,
        },
        { status: 400 },
      )
    }

    const validatedData = validationResult.data

    // Check if farm exists and user has access
    const farm = await prisma.farm.findFirst({
      where: {
        id: validatedData.farmId,
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
    })

    if (!farm) {
      return NextResponse.json(
        { error: 'ไม่พบฟาร์มหรือคุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 },
      )
    }

    // Check if animal type exists
    const animalType = await prisma.animalType.findUnique({
      where: { id: validatedData.animalTypeId },
    })

    if (!animalType) {
      return NextResponse.json(
        { error: 'ไม่พบประเภทสัตว์ที่เลือก' },
        { status: 400 },
      )
    }

    // Handle microchip - use provided one or generate new
    let microchip = validatedData.microchip

    if (microchip) {
      // Check if provided microchip is already in use
      const existingAnimal = await prisma.animal.findFirst({
        where: { microchip },
      })

      if (existingAnimal) {
        return NextResponse.json(
          { error: 'ไมโครชิปนี้มีการใช้งานแล้ว กรุณาใช้ไมโครชิปอื่น' },
          { status: 409 },
        )
      }
    } else {
      // Generate unique microchip if not provided
      microchip = await generateMicrochip(validatedData.farmId)
    }

    // Upload validated and secure image to Supabase Storage
    const imagePath = generateUniqueFilename(payload.userId, secureFilename)
    const imageUploadResult = await uploadToStorage(
      ANIMAL_PHOTOS_BUCKET,
      imagePath,
      validatedFile,
    )

    if (!imageUploadResult.success) {
      return NextResponse.json(
        { error: imageUploadResult.error || 'ไม่สามารถอัปโหลดรูปภาพได้' },
        { status: 500 },
      )
    }

    // Create animal record with image URL
    const animal = await prisma.animal.create({
      data: {
        name: validatedData.name,
        microchip,
        animalTypeId: validatedData.animalTypeId,
        farmId: validatedData.farmId,
        birthDate: validatedData.birthDate,
        weight: validatedData.weight,
        height: validatedData.height,
        color: validatedData.color,
        fatherName: validatedData.fatherName,
        motherName: validatedData.motherName,
        notes: validatedData.notes,
        photoUrl: imageUploadResult.url,
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
      message: 'เพิ่มสัตว์เลี้ยงสำเร็จ',
      animalId: animal.id,
      microchip: animal.microchip,
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
      },
    })
  } catch (error) {
    console.error('Error creating animal:', error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'เลขไมโครชิปซ้ำกัน กรุณาลองใหม่อีกครั้ง' },
          { status: 409 },
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'ข้อมูลอ้างอิงไม่ถูกต้อง' },
          { status: 400 },
        )
      }
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 },
    )
  }
}
