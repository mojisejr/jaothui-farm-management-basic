import { Calendar, Tag, Weight, Ruler, Palette } from 'lucide-react'
import Link from 'next/link'

interface AnimalType {
  id: string
  name: string
}

interface Animal {
  id: string
  name: string
  microchip: string | null
  birthDate: string | null
  weight: number | null
  height: number | null
  color: string | null
  image: string | null
  createdAt: string
  animalType: AnimalType | null
}

interface AnimalCardProps {
  animal: Animal
  farmId: string
}

export default function AnimalCard({ animal }: AnimalCardProps) {
  // คำนวณอายุจากวันเกิด
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const today = new Date()
    const ageInMonths =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth())

    if (ageInMonths < 12) {
      return `${ageInMonths} เดือน`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years} ปี ${months} เดือน` : `${years} ปี`
    }
  }

  // ฟอร์แมตวันที่
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="card-title text-lg font-bold text-base-content">
              {animal.name}
            </h3>
            {animal.animalType && (
              <div className="badge badge-primary badge-sm mt-1">
                {animal.animalType.name}
              </div>
            )}
          </div>

          {animal.image && (
            <div className="avatar">
              <div className="w-12 h-12 rounded-full">
                <img
                  src={animal.image}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Microchip */}
        {animal.microchip && (
          <div className="flex items-center gap-2 text-sm text-base-content/70 mb-2">
            <Tag className="w-4 h-4" />
            <span className="font-mono">{animal.microchip}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* Age */}
          {animal.birthDate && (
            <div className="flex items-center gap-1 text-base-content/70">
              <Calendar className="w-4 h-4" />
              <span>{calculateAge(animal.birthDate)}</span>
            </div>
          )}

          {/* Weight */}
          {animal.weight && (
            <div className="flex items-center gap-1 text-base-content/70">
              <Weight className="w-4 h-4" />
              <span>{animal.weight} กก.</span>
            </div>
          )}

          {/* Height */}
          {animal.height && (
            <div className="flex items-center gap-1 text-base-content/70">
              <Ruler className="w-4 h-4" />
              <span>{animal.height} ซม.</span>
            </div>
          )}

          {/* Color */}
          {animal.color && (
            <div className="flex items-center gap-1 text-base-content/70">
              <Palette className="w-4 h-4" />
              <span>{animal.color}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-actions justify-between items-center mt-4 pt-3 border-t border-base-300">
          <div className="text-xs text-base-content/50">
            เพิ่มเมื่อ {formatDate(animal.createdAt)}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/animal/${animal.id}`}
              className="btn btn-sm btn-ghost"
            >
              ดูรายละเอียด
            </Link>
            <Link
              href={`/animal/${animal.id}/edit`}
              className="btn btn-sm btn-primary"
            >
              แก้ไข
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
