'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus } from 'lucide-react'
import { FarmLayout } from '@/components/layouts/FarmLayout'
import ActivitiesList from '@/components/ActivitiesList'

function ActivitiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const farmId = searchParams.get('farmId')
  
  if (!farmId) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-warning" />
          <p className="text-lg mb-4">ไม่พบข้อมูลฟาร์ม</p>
          <button
            onClick={() => router.push('/farms')}
            className="btn btn-primary"
          >
            กลับไปรายการฟาร์ม
          </button>
        </div>
      </div>
    )
  }

  return (
    <FarmLayout
      title="กิจกรรมทั้งหมด"
      subtitle="ดูและจัดการกิจกรรมทั้งหมดในฟาร์ม"
      farmId={farmId}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              กิจกรรมทั้งหมด
            </h1>
            <p className="text-base-content/70 mt-1">
              ดูและจัดการกิจกรรมทั้งหมดในฟาร์ม
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/schedule/create?farmId=${farmId}`)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">กำหนดการ</span>
            </button>
            <button
              onClick={() => router.push(`/activity/create?farmId=${farmId}`)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">บันทึกกิจกรรม</span>
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-base-100 rounded-xl shadow-sm">
          <ActivitiesList farmId={farmId} />
        </div>
      </motion.div>
    </FarmLayout>
  )
}

export default function ActivityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <ActivitiesContent />
    </Suspense>
  )
}