import { useState } from 'react'
import { toast } from 'sonner'
import { 
  generateAnimalBasicCSV,
  generateAnimalActivitiesCSV, 
  generateAnimalReportCSV,
  generateAnimalCSVFilename,
  downloadCSV,
  type AnimalExportData 
} from '@/lib/csv-export'

export type ExportType = 'basic' | 'activities' | 'report'

export interface UseCSVExportOptions {
  onExportStart?: () => void
  onExportSuccess?: (type: ExportType, filename: string) => void
  onExportError?: (error: Error) => void
}

export function useCSVExport(options: UseCSVExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    current: number
    total: number
    step: string
  } | null>(null)

  const exportAnimalData = async (
    animal: AnimalExportData, 
    type: ExportType = 'report'
  ) => {
    setIsExporting(true)
    setExportProgress({ current: 1, total: 3, step: 'กำลังเตรียมข้อมูล...' })
    
    try {
      options.onExportStart?.()
      
      let csvContent: string
      let filename: string
      
      setExportProgress({ current: 2, total: 3, step: 'กำลังสร้างไฟล์ CSV...' })
      
      switch (type) {
        case 'basic':
          csvContent = generateAnimalBasicCSV(animal)
          filename = generateAnimalCSVFilename(animal, 'basic')
          break
          
        case 'activities':
          csvContent = generateAnimalActivitiesCSV(animal)
          filename = generateAnimalCSVFilename(animal, 'activities')
          break
          
        case 'report':
        default:
          csvContent = generateAnimalReportCSV(animal)
          filename = generateAnimalCSVFilename(animal, 'report')
          break
      }
      
      setExportProgress({ current: 3, total: 3, step: 'กำลังดาวน์โหลด...' })
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500))
      
      downloadCSV(csvContent, filename)
      
      toast.success(`ส่งออกข้อมูลสำเร็จ: ${filename}`)
      options.onExportSuccess?.(type, filename)
      
    } catch (error) {
      console.error('CSV Export Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      toast.error(errorMessage)
      options.onExportError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const exportMultipleAnimals = async (
    animals: AnimalExportData[],
    type: ExportType = 'basic'
  ) => {
    if (animals.length === 0) {
      toast.error('ไม่มีข้อมูลสัตว์ให้ส่งออก')
      return
    }

    setIsExporting(true)
    setExportProgress({ current: 1, total: animals.length + 2, step: 'กำลังเตรียมข้อมูล...' })
    
    try {
      options.onExportStart?.()
      
      const headers = [
        { key: 'name', label: 'ชื่อสัตว์' },
        { key: 'microchip', label: 'ไมโครชิป' },
        { key: 'animalType', label: 'ประเภทสัตว์' },
        { key: 'birthDate', label: 'วันเกิด (พ.ศ.)' },
        { key: 'weight', label: 'น้ำหนัก (กก.)' },
        { key: 'height', label: 'ส่วนสูง (ซม.)' },
        { key: 'color', label: 'สี/ลักษณะ' },
        { key: 'fatherName', label: 'ชื่อพ่อพันธุ์' },
        { key: 'motherName', label: 'ชื่อแม่พันธุ์' },
        { key: 'farmName', label: 'ชื่อฟาร์ม' },
        { key: 'ownerName', label: 'เจ้าของฟาร์ม' },
        { key: 'createdAt', label: 'วันที่ลงทะเบียน (พ.ศ.)' },
      ]

      const csvData = animals.map((animal, index) => {
        setExportProgress({ 
          current: index + 2, 
          total: animals.length + 2, 
          step: `กำลังประมวลผล ${animal.name}...` 
        })
        
        return {
          name: animal.name,
          microchip: animal.microchip || '-',
          animalType: animal.animalType?.name || '-',
          birthDate: animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            calendar: 'buddhist' 
          }) : '-',
          weight: animal.weight || '-',
          height: animal.height || '-', 
          color: animal.color || '-',
          fatherName: animal.fatherName || '-',
          motherName: animal.motherName || '-',
          farmName: animal.farm.name,
          ownerName: animal.farm.owner.name,
          createdAt: new Date(animal.createdAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            calendar: 'buddhist'
          }),
        }
      })

      setExportProgress({ 
        current: animals.length + 1, 
        total: animals.length + 2, 
        step: 'กำลังสร้างไฟล์ CSV...' 
      })

      const csvContent = [
        headers.map(h => h.label).join(','),
        ...csvData.map(row => 
          headers.map(h => {
            const value = row[h.key as keyof typeof row]
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      const date = new Date()
      const buddhistYear = date.getFullYear() + 543
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      
      const filename = `รายชื่อสัตว์_${animals.length}ตัว_${buddhistYear}${month}${day}.csv`

      setExportProgress({ 
        current: animals.length + 2, 
        total: animals.length + 2, 
        step: 'กำลังดาวน์โหลด...' 
      })

      await new Promise(resolve => setTimeout(resolve, 500))
      
      downloadCSV(csvContent, filename)
      
      toast.success(`ส่งออกข้อมูล ${animals.length} ตัวสำเร็จ`)
      options.onExportSuccess?.(type, filename)
      
    } catch (error) {
      console.error('Multiple CSV Export Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      toast.error(errorMessage)
      options.onExportError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  return {
    exportAnimalData,
    exportMultipleAnimals,
    isExporting,
    exportProgress,
  }
}