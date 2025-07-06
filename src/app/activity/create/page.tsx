'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Calendar, FileText, Users } from 'lucide-react'
import { ActivityForm } from '@/components/forms/ActivityForm'
import { FarmLayout } from '@/components/layouts/FarmLayout'
import { useFarmAnimals } from '@/hooks/useFarmAnimals'

function CreateActivityContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const animalId = searchParams.get('animalId')
  const farmId = searchParams.get('farmId')
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(animalId)
  
  // Fetch farm animals if we need to show animal selection
  const shouldFetchAnimals = !!farmId && !animalId
  const { data: animalsData, isLoading: animalsLoading } = useFarmAnimals({ 
    farmId: shouldFetchAnimals ? farmId : '', 
    page: 1, 
    limit: 100 
  })
  
  if (!farmId) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-warning" />
          <p className="text-lg mb-4">ไม่พบข้อมูลฟาร์ม</p>
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

  // Show animal selection if no animalId is provided
  if (!selectedAnimalId) {
    return (
      <FarmLayout
        title="เลือกสัตว์"
        subtitle="เลือกสัตว์ที่ต้องการบันทึกกิจกรรม"
        farmId={farmId}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">เลือกสัตว์</h1>
            </div>
            <p className="text-base-content/70">
              เลือกสัตว์ที่ต้องการบันทึกกิจกรรม
            </p>
          </div>

          {/* Animal Selection */}
          {animalsLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animalsData?.animals.map((animal) => (
                <div
                  key={animal.id}
                  onClick={() => setSelectedAnimalId(animal.id)}
                  className="card bg-base-100 shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-base-200 hover:border-primary"
                >
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3">
                      {animal.photoUrl ? (
                        <Image
                          src={animal.photoUrl}
                          alt={animal.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-12 h-12">
                            <span className="text-lg font-bold">
                              {animal.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{animal.name}</h3>
                        {animal.animalType && (
                          <p className="text-sm text-base-content/70">
                            {animal.animalType.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </FarmLayout>
    )
  }

  return (
    <FarmLayout
      title="บันทึกกิจกรรม"
      subtitle="บันทึกกิจกรรมที่ทำแล้วเสร็จสำหรับสัตว์"
      farmId={farmId}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">บันทึกกิจกรรม</h1>
          </div>
          <p className="text-base-content/70">
            บันทึกกิจกรรมที่ทำแล้วเสร็จสำหรับสัตว์
          </p>
        </div>

        {/* Activity Form */}
        <ActivityForm 
          animalId={selectedAnimalId}
          farmId={farmId}
          onSuccess={() => {
            router.push(`/farm/${farmId}/dashboard`)
          }}
          onCancel={() => {
            router.back()
          }}
        />
      </motion.div>
    </FarmLayout>
  )
}

export default function CreateActivityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <CreateActivityContent />
    </Suspense>
  )
}