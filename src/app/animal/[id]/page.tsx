'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  Weight,
  Ruler,
  Palette,
  Heart,
  Edit3,
  Trash2,
  Tag,
  MapPin,
  Clock,
  User,
  PawPrint,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useAnimal, useDeleteAnimal } from '@/hooks/useFarmAnimals'
import { ActivityHistory } from '@/components/ActivityHistory'
import { CSVExportButton } from '@/components/CSVExportButton'
import { motion } from 'framer-motion'

export default function AnimalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const animalId = params.id as string
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data, isLoading, error } = useAnimal(animalId)
  const deleteAnimal = useDeleteAnimal()

  const handleDelete = async () => {
    try {
      await deleteAnimal.mutateAsync(animalId)
      toast.success('ลบข้อมูลสัตว์สำเร็จ')
      router.push(`/farm/${data?.animal.farm.id}`)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถลบข้อมูลสัตว์ได้')
    }
  }

  // Convert Buddhist Era to Gregorian for display
  const getBuddhistYear = (date: string) => {
    const gregorianYear = new Date(date).getFullYear()
    return gregorianYear + 543
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const buddhistYear = getBuddhistYear(dateString)
    const month = date.toLocaleDateString('th-TH', { month: 'long' })
    const day = date.getDate()
    return `${day} ${month} ${buddhistYear}`
  }

  const formatAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - birth.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} วัน`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} เดือน`
    } else {
      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return months > 0 ? `${years} ปี ${months} เดือน` : `${years} ปี`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">กำลังโหลดข้อมูลสัตว์...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-error" />
          <p className="text-lg mb-4">ไม่สามารถโหลดข้อมูลสัตว์ได้</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            กลับไปหน้าก่อน
          </button>
        </div>
      </div>
    )
  }

  if (!data?.animal) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-12 h-12 mx-auto mb-4 text-warning" />
          <p className="text-lg mb-4">ไม่พบข้อมูลสัตว์</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            กลับไปหน้าก่อน
          </button>
        </div>
      </div>
    )
  }

  const animal = data.animal

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost text-black"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับ
          </button>
          
          <div className="flex gap-2">
            <CSVExportButton 
              animal={animal}
              variant="button"
              size="md"
              className="btn-outline"
            />
            <button
              onClick={() => router.push(`/animal/${animalId}/edit`)}
              className="btn btn-outline btn-primary"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              แก้ไข
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline btn-error"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ลบ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Animal Photo */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body p-0">
                {animal.photoUrl ? (
                  <div className="aspect-square rounded-t-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={animal.photoUrl}
                      alt={animal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-t-2xl bg-base-300 flex items-center justify-center">
                    <PawPrint className="w-16 h-16 text-base-content/30" />
                  </div>
                )}
                
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-center mb-2">{animal.name}</h1>
                  <div className="text-center text-base-content/60 mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>{animal.microchip || 'ไม่มีไมโครชิป'}</span>
                    </div>
                  </div>
                  
                  <div className="badge badge-primary w-full py-3 text-sm">
                    {animal.animalType?.name || 'ไม่ระบุประเภท'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Animal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">ข้อมูลพื้นฐาน</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {animal.birthDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-base-content/60">วันเกิด</div>
                        <div className="font-medium">{formatDate(animal.birthDate)}</div>
                        <div className="text-xs text-base-content/60">
                          อายุ {formatAge(animal.birthDate)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {animal.weight && (
                    <div className="flex items-center gap-3">
                      <Weight className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-base-content/60">น้ำหนัก</div>
                        <div className="font-medium">{animal.weight} กิโลกรัม</div>
                      </div>
                    </div>
                  )}
                  
                  {animal.height && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-base-content/60">ส่วนสูง</div>
                        <div className="font-medium">{animal.height} เซนติเมตร</div>
                      </div>
                    </div>
                  )}
                  
                  {animal.color && (
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-base-content/60">สี/ลักษณะ</div>
                        <div className="font-medium">{animal.color}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Breeding Information */}
            {(animal.fatherName || animal.motherName) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card bg-base-100 shadow-xl"
              >
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">ข้อมูลการผสมพันธุ์</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {animal.fatherName && (
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-base-content/60">พ่อพันธุ์</div>
                          <div className="font-medium">{animal.fatherName}</div>
                        </div>
                      </div>
                    )}
                    
                    {animal.motherName && (
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-base-content/60">แม่พันธุ์</div>
                          <div className="font-medium">{animal.motherName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Farm Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">ข้อมูลฟาร์ม</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-base-content/60">ชื่อฟาร์ม</div>
                      <div className="font-medium">{animal.farm.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-base-content/60">เจ้าของฟาร์ม</div>
                      <div className="font-medium">{animal.farm.owner.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notes */}
            {animal.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-base-100 shadow-xl"
              >
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">บันทึกเพิ่มเติม</h2>
                  <p className="text-base-content/80 whitespace-pre-wrap">{animal.notes}</p>
                </div>
              </motion.div>
            )}

            {/* Activity History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <ActivityHistory
                  animalId={animal.id}
                  animalName={animal.name}
                  activities={animal.activities}
                  schedules={animal.activitySchedules}
                  showAddButton={true}
                  maxItems={5}
                />
              </div>
            </motion.div>

            {/* Timestamps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">ข้อมูลระบบ</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-base-content/60">วันที่เพิ่มข้อมูล</div>
                      <div className="font-medium">{formatDate(animal.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-base-content/60">อัปเดตล่าสุด</div>
                      <div className="font-medium">{formatDate(animal.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">ยืนยันการลบ</h3>
              <p className="mb-4">
                คุณแน่ใจหรือไม่ที่จะลบข้อมูลสัตว์ <strong>{animal.name}</strong>?
              </p>
              <p className="text-sm text-base-content/60 mb-6">
                การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลทั้งหมดจะถูกลบอย่างถาวร
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-ghost text-black"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteAnimal.isPending}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleDelete}
                  disabled={deleteAnimal.isPending}
                >
                  {deleteAnimal.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      ลบข้อมูล
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}