'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Clock, Plus, Calendar } from 'lucide-react'
import { FarmLayout } from '@/components/layouts/FarmLayout'
import SchedulesList from '@/components/SchedulesList'

function SchedulesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const farmId = searchParams.get('farmId')
  
  if (!farmId) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-warning" />
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
      title="กำหนดการทั้งหมด"
      subtitle="ดูและจัดการกำหนดการกิจกรรมในอนาคต"
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
              <Clock className="w-6 h-6 text-secondary" />
              กำหนดการทั้งหมด
            </h1>
            <p className="text-base-content/70 mt-1">
              ดูและจัดการกำหนดการกิจกรรมในอนาคต
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/activity/create?farmId=${farmId}`)}
              className="btn btn-primary btn-sm"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">บันทึกกิจกรรม</span>
            </button>
            <button
              onClick={() => router.push(`/schedule/create?farmId=${farmId}`)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">เพิ่มกำหนดการ</span>
            </button>
          </div>
        </div>

        {/* Schedules List */}
        <div className="bg-base-100 rounded-xl shadow-sm">
          <SchedulesList farmId={farmId} />
        </div>
      </motion.div>
    </FarmLayout>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <SchedulesContent />
    </Suspense>
  )
}