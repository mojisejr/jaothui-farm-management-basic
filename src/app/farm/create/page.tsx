'use client'

import { useFormState } from 'react-dom'
import { createFarm } from './actions'
import { THAI_PROVINCES, CROP_TYPES } from '@/types/farm'
import { useState } from 'react'

const initialState = {
  message: '',
}

export default function CreateFarmPage() {
  const [state, formAction] = useFormState(createFarm, initialState)
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])

  const handleCropChange = (crop: string, checked: boolean) => {
    if (checked) {
      setSelectedCrops([...selectedCrops, crop])
    } else {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop))
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">สร้างฟาร์มใหม่</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form action={formAction}>
              {/* ชื่อฟาร์ม */}
              <div className="form-control">
                <label className="label" htmlFor="name">
                  <span className="label-text">ชื่อฟาร์ม</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input input-bordered"
                  placeholder="เช่น ฟาร์มเจ้าทุ่ย"
                />
              </div>

              {/* จังหวัด */}
              <div className="form-control mt-4">
                <label className="label" htmlFor="province">
                  <span className="label-text">จังหวัด</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="province"
                  name="province"
                  required
                  className="select select-bordered"
                  defaultValue=""
                >
                  <option disabled value="">
                    เลือกจังหวัด
                  </option>
                  {THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              {/* ขนาดพื้นที่ */}
              <div className="form-control mt-4">
                <label className="label" htmlFor="size">
                  <span className="label-text">ขนาดพื้นที่ (ไร่)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="size"
                  name="size"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  required
                  className="input input-bordered"
                  placeholder="เช่น 5.5"
                />
              </div>

              {/* ประเภทพืชที่ปลูก */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">ประเภทพืชที่ปลูก</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-base-300 rounded-lg max-h-48 overflow-y-auto">
                  {CROP_TYPES.map((crop) => (
                    <label
                      key={crop}
                      className="cursor-pointer label justify-start gap-2 p-1"
                    >
                      <input
                        type="checkbox"
                        value={crop}
                        checked={selectedCrops.includes(crop)}
                        onChange={(e) =>
                          handleCropChange(crop, e.target.checked)
                        }
                        className="checkbox checkbox-sm"
                      />
                      <span className="label-text text-sm">{crop}</span>
                    </label>
                  ))}
                </div>
                {/* Hidden inputs for selected crops */}
                {selectedCrops.map((crop, index) => (
                  <input
                    key={index}
                    type="hidden"
                    name="cropTypes"
                    value={crop}
                  />
                ))}
              </div>

              {/* รายละเอียดเพิ่มเติม */}
              <div className="form-control mt-4">
                <label className="label" htmlFor="description">
                  <span className="label-text">รายละเอียดเพิ่มเติม</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="textarea textarea-bordered h-24"
                  placeholder="บอกเล่าเกี่ยวกับฟาร์มของคุณ (ไม่จำเป็น)"
                />
              </div>

              {/* Submit Button */}
              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary">
                  สร้างฟาร์ม
                </button>
              </div>

              {/* Error Message */}
              {state?.message && (
                <div className="alert alert-error mt-4">
                  <span>{state.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
