'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import {
  Camera,
  Upload,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  currentImage?: string | null
  onImageSelect: (file: File | null, preview: string | null) => void
  disabled?: boolean
}

export default function ImageUpload({
  currentImage,
  onImageSelect,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'compressing' | 'ready' | 'error'
  >('idle')

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Maximum file size 1MB
      maxWidthOrHeight: 800, // Maximum dimension
      useWebWorker: true,
      onProgress: (progress: number) => {
        setCompressionProgress(Math.round(progress))
      },
    }

    try {
      setIsCompressing(true)
      setUploadStatus('compressing')
      const compressedFile = await imageCompression(file, options)

      // Create new file with better naming
      const newFile = new File([compressedFile], `profile-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      setUploadStatus('ready')
      return newFile
    } catch (error) {
      console.error('Image compression error:', error)
      setUploadStatus('error')
      throw new Error('เกิดข้อผิดพลาดในการบีบอัดรูปภาพ')
    } finally {
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
        setUploadStatus('error')
        return
      }

      // Validate file size (10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 10MB')
        setUploadStatus('error')
        return
      }

      try {
        // Compress image
        const compressedFile = await compressImage(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string
          setPreview(previewUrl)
          onImageSelect(compressedFile, previewUrl)
          toast.success(
            `รูปภาพถูกบีบอัดจาก ${(file.size / 1024 / 1024).toFixed(2)}MB เป็น ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
          )
        }
        reader.readAsDataURL(compressedFile)
      } catch (_error) {
        toast.error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ')
        setUploadStatus('error')
      }
    },
    [onImageSelect],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: handleFileSelect,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      },
      maxFiles: 1,
      disabled: disabled || isCompressing,
    })

  const handleRemoveImage = () => {
    setPreview(null)
    setUploadStatus('idle')
    onImageSelect(null, null)
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'compressing':
        return <Loader className="animate-spin" size={20} />
      case 'ready':
        return <CheckCircle className="text-green-500" size={20} />
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />
      default:
        return <Camera size={20} />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'compressing':
        return `กำลังบีบอัดรูปภาพ... ${compressionProgress}%`
      case 'ready':
        return 'รูปภาพพร้อมอัปโหลด'
      case 'error':
        return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      default:
        return 'เลือกรูปภาพ'
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Current/Preview Image */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
          {preview ? (
            <img
              src={preview}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={32} className="text-gray-400" />
          )}
        </div>

        {preview && !disabled && (
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative w-full max-w-md p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${disabled || isCompressing ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
          ${uploadStatus === 'ready' ? 'border-green-400 bg-green-50' : ''}
          ${uploadStatus === 'error' ? 'border-red-400 bg-red-50' : 'border-gray-300'}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-2 text-center">
          {getStatusIcon()}

          <div>
            <p className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </p>
            {uploadStatus === 'idle' && (
              <>
                <p className="text-xs text-gray-500 mt-1">
                  ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  รองรับ: JPG, PNG, WEBP (ไม่เกิน 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isCompressing && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${compressionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload Features Info */}
      <div className="text-xs text-gray-500 text-center max-w-md">
        <div className="flex items-center justify-center space-x-4">
          <span className="flex items-center">
            <Upload size={12} className="mr-1" />
            อัตโนมัติบีบอัด
          </span>
          <span className="flex items-center">
            <CheckCircle size={12} className="mr-1" />
            ปรับขนาด 800px
          </span>
          <span className="flex items-center">
            <Loader size={12} className="mr-1" />
            แสดงความคืบหน้า
          </span>
        </div>
      </div>
    </div>
  )
}
