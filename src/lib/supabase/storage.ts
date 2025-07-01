import { supabase } from './client'

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)

      // Handle bucket not found
      if (uploadError.message.includes('Bucket not found')) {
        // Try to create bucket if it doesn't exist
        const { error: createBucketError } =
          await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          })

        if (createBucketError) {
          console.error('Create bucket error:', createBucketError)
          return {
            success: false,
            error: 'ไม่สามารถสร้าง storage bucket ได้',
          }
        }

        // Retry upload after creating bucket
        const { data: retryUploadData, error: retryUploadError } =
          await supabase.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (retryUploadError || !retryUploadData) {
          console.error('Retry upload error:', retryUploadError)
          return {
            success: false,
            error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
          }
        }

        // Get public URL from retry data
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(retryUploadData.path)

        return {
          success: true,
          url: urlData.publicUrl,
        }
      }

      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
      }
    }

    if (!uploadData) {
      return {
        success: false,
        error: 'ไม่สามารถอัปโหลดไฟล์ได้',
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    return {
      success: true,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Storage upload error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
    }
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromStorage(
  bucket: string,
  path: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: 'ไม่สามารถลบไฟล์เก่าได้',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Storage delete error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบไฟล์',
    }
  }
}

/**
 * Extract file path from Supabase Storage URL
 */
export function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex((part) => part === bucket)

    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }

    return null
  } catch {
    return null
  }
}

/**
 * Generate unique filename for uploads
 */
export function generateUniqueFilename(
  userId: string,
  originalFilename: string,
): string {
  const timestamp = Date.now()
  const fileExt = originalFilename.split('.').pop() || 'jpg'
  return `${userId}-${timestamp}.${fileExt}`
}
