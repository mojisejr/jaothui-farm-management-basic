/**
 * File security validation utilities
 */

// Magic bytes for allowed image formats
const ALLOWED_FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xDB],
    [0xFF, 0xD8, 0xFF, 0xE0],
    [0xFF, 0xD8, 0xFF, 0xE1],
    [0xFF, 0xD8, 0xFF, 0xE2],
    [0xFF, 0xD8, 0xFF, 0xE3],
    [0xFF, 0xD8, 0xFF, 0xE8],
    [0xFF, 0xD8, 0xFF, 0xEE],
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
  'image/bmp': [[0x42, 0x4D]],
} as const

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 5 * 1024 * 1024,   // 5MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'image/bmp': 5 * 1024 * 1024,   // 5MB
} as const

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.pl', '.rb', '.sh', '.ps1',
  '.html', '.htm', '.svg', '.xml', '.xhtml'
] as const

export interface FileValidationResult {
  isValid: boolean
  error?: string
  detectedMimeType?: string
  sanitizedFilename?: string
}

/**
 * Validate file by checking magic bytes signature
 */
export async function validateFileSignature(file: File): Promise<FileValidationResult> {
  try {
    // Read first 16 bytes for signature check
    const buffer = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Check against known signatures
    for (const [mimeType, signatures] of Object.entries(ALLOWED_FILE_SIGNATURES)) {
      for (const signature of signatures) {
        let matches = true
        for (let i = 0; i < signature.length; i++) {
          if (signature[i] !== null && bytes[i] !== signature[i]) {
            matches = false
            break
          }
        }
        if (matches) {
          return {
            isValid: true,
            detectedMimeType: mimeType
          }
        }
      }
    }
    
    return {
      isValid: false,
      error: 'ประเภทไฟล์ไม่ได้รับอนุญาต กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'
    }
  } catch (_error) {
    return {
      isValid: false,
      error: 'ไม่สามารถตรวจสอบไฟล์ได้'
    }
  }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, detectedMimeType?: string): FileValidationResult {
  const mimeType = detectedMimeType || file.type
  const maxSize = MAX_FILE_SIZES[mimeType as keyof typeof MAX_FILE_SIZES] || 5 * 1024 * 1024 // Default 5MB
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      isValid: false,
      error: `ขนาดไฟล์เกิน ${maxSizeMB}MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า`
    }
  }
  
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่ถูกต้อง'
    }
  }
  
  return { isValid: true }
}

/**
 * Sanitize filename to prevent path traversal and dangerous extensions
 */
export function sanitizeFilename(filename: string): FileValidationResult {
  // Remove directory traversal attempts
  let sanitized = filename.replace(/[\/\\]/g, '')
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '')
  
  // Check for dangerous extensions
  const lowerFilename = sanitized.toLowerCase()
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerFilename.endsWith(ext)) {
      return {
        isValid: false,
        error: `นามสกุลไฟล์ ${ext} ไม่ได้รับอนุญาต`
      }
    }
  }
  
  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized.trim().length === 0) {
    sanitized = `upload_${Date.now()}.jpg`
  }
  
  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    sanitized = sanitized.substring(0, 255 - ext.length) + ext
  }
  
  return {
    isValid: true,
    sanitizedFilename: sanitized
  }
}

/**
 * Comprehensive file validation
 */
export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
  // 1. Basic MIME type check
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'
    }
  }
  
  // 2. Validate filename
  const filenameResult = sanitizeFilename(file.name)
  if (!filenameResult.isValid) {
    return filenameResult
  }
  
  // 3. Validate file signature (magic bytes)
  const signatureResult = await validateFileSignature(file)
  if (!signatureResult.isValid) {
    return signatureResult
  }
  
  // 4. Check if detected MIME type matches declared type
  if (signatureResult.detectedMimeType && 
      signatureResult.detectedMimeType !== file.type) {
    return {
      isValid: false,
      error: 'ประเภทไฟล์ไม่ตรงกับเนื้อหาภายในไฟล์'
    }
  }
  
  // 5. Validate file size
  const sizeResult = validateFileSize(file, signatureResult.detectedMimeType)
  if (!sizeResult.isValid) {
    return sizeResult
  }
  
  return {
    isValid: true,
    detectedMimeType: signatureResult.detectedMimeType,
    sanitizedFilename: filenameResult.sanitizedFilename
  }
}

/**
 * Generate secure filename with timestamp and random suffix
 */
export function generateSecureFilename(originalName: string, userId?: string): string {
  const sanitizeResult = sanitizeFilename(originalName)
  const cleanName = sanitizeResult.sanitizedFilename || 'upload.jpg'
  
  // Extract extension
  const extension = cleanName.substring(cleanName.lastIndexOf('.')) || '.jpg'
  
  // Generate secure filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const userPrefix = userId ? userId.substring(0, 8) : 'user'
  
  return `${userPrefix}_${timestamp}_${random}${extension}`
}

/**
 * Validate and process file for upload
 */
export async function processFileUpload(
  file: File, 
  userId?: string
): Promise<{ isValid: boolean; error?: string; filename?: string; processedFile?: File }> {
  
  // Validate file
  const validation = await validateUploadedFile(file)
  if (!validation.isValid) {
    return { isValid: false, error: validation.error }
  }
  
  // Generate secure filename
  const secureFilename = generateSecureFilename(file.name, userId)
  
  // Create new file object with secure name
  const processedFile = new File([file], secureFilename, {
    type: validation.detectedMimeType || file.type,
    lastModified: file.lastModified
  })
  
  return {
    isValid: true,
    filename: secureFilename,
    processedFile
  }
}