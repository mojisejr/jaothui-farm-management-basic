/**
 * CSV Export utilities for animal data with Thai language support
 */

export interface AnimalExportData {
  id: string
  name: string
  microchip: string | null
  animalType: {
    name: string
    description?: string | null
  } | null
  birthDate: string | null
  weight: number | null
  height: number | null
  color: string | null
  fatherName: string | null
  motherName: string | null
  notes: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
  farm: {
    id: string
    name: string
    owner: {
      name: string
    }
  }
  activities?: Array<{
    id: string
    title: string
    description: string | null
    activityDate: string
    status: string
  }>
  activitySchedules?: Array<{
    id: string
    title: string
    description: string | null
    scheduledDate: string
    status: string
    isRecurring: boolean
  }>
}

/**
 * Convert Gregorian year to Buddhist Era (พ.ศ.)
 */
export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543
}

/**
 * Format date to Thai format with Buddhist Era
 */
export function formatThaiDate(dateString: string | null): string {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  const buddhistYear = toBuddhistYear(date.getFullYear())
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  
  return `${day}/${month}/${buddhistYear}`
}

/**
 * Format date and time to Thai format with Buddhist Era
 */
export function formatThaiDateTime(dateString: string): string {
  const date = new Date(dateString)
  const buddhistYear = toBuddhistYear(date.getFullYear())
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${buddhistYear} ${hours}:${minutes}`
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
export function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return ''
  
  const str = String(field)
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

/**
 * Convert array of objects to CSV string with Thai headers
 */
export function arrayToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map(h => escapeCSVField(h.label)).join(',')
  
  const dataRows = data.map(row => 
    headers.map(h => escapeCSVField(row[h.key] as string | number | null | undefined)).join(',')
  )
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Generate animal basic information CSV
 */
export function generateAnimalBasicCSV(animal: AnimalExportData): string {
  const headers = [
    { key: 'field', label: 'รายการ' },
    { key: 'value', label: 'ข้อมูล' },
  ]
  
  const data = [
    { field: 'ชื่อสัตว์', value: animal.name },
    { field: 'ไมโครชิป', value: animal.microchip || '-' },
    { field: 'ประเภทสัตว์', value: animal.animalType?.name || '-' },
    { field: 'วันเกิด (พ.ศ.)', value: formatThaiDate(animal.birthDate) },
    { field: 'น้ำหนัก (กก.)', value: animal.weight || '-' },
    { field: 'ส่วนสูง (ซม.)', value: animal.height || '-' },
    { field: 'สี/ลักษณะ', value: animal.color || '-' },
    { field: 'ชื่อพ่อพันธุ์', value: animal.fatherName || '-' },
    { field: 'ชื่อแม่พันธุ์', value: animal.motherName || '-' },
    { field: 'หมายเหตุ', value: animal.notes || '-' },
    { field: 'ชื่อฟาร์ม', value: animal.farm.name },
    { field: 'เจ้าของฟาร์ม', value: animal.farm.owner.name },
    { field: 'วันที่ลงทะเบียน (พ.ศ.)', value: formatThaiDateTime(animal.createdAt) },
    { field: 'อัปเดตล่าสุด (พ.ศ.)', value: formatThaiDateTime(animal.updatedAt) },
  ]
  
  return arrayToCSV(data, headers)
}

/**
 * Generate animal activities CSV
 */
export function generateAnimalActivitiesCSV(animal: AnimalExportData): string {
  const headers = [
    { key: 'type', label: 'ประเภท' },
    { key: 'title', label: 'ชื่อกิจกรรม' },
    { key: 'description', label: 'รายละเอียด' },
    { key: 'date', label: 'วันที่ (พ.ศ.)' },
    { key: 'status', label: 'สถานะ' },
    { key: 'isRecurring', label: 'กิจกรรมซ้ำ' },
  ]
  
  const activities = animal.activities || []
  const schedules = animal.activitySchedules || []
  
  const statusMap = {
    'PENDING': 'รอดำเนินการ',
    'IN_PROGRESS': 'กำลังดำเนินการ', 
    'COMPLETED': 'เสร็จสิ้น',
    'CANCELLED': 'ยกเลิก',
  }
  
  const data = [
    ...activities.map(activity => ({
      type: 'กิจกรรมที่ทำแล้ว',
      title: activity.title,
      description: activity.description || '-',
      date: formatThaiDateTime(activity.activityDate),
      status: statusMap[activity.status as keyof typeof statusMap] || activity.status,
      isRecurring: '-',
    })),
    ...schedules.map(schedule => ({
      type: 'กิจกรรมที่กำหนดไว้',
      title: schedule.title,
      description: schedule.description || '-',
      date: formatThaiDateTime(schedule.scheduledDate),
      status: statusMap[schedule.status as keyof typeof statusMap] || schedule.status,
      isRecurring: schedule.isRecurring ? 'ใช่' : 'ไม่ใช่',
    })),
  ]
  
  // Sort by date (newest first)
  data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  return arrayToCSV(data, headers)
}

/**
 * Generate comprehensive animal report CSV
 */
export function generateAnimalReportCSV(animal: AnimalExportData): string {
  const currentDate = formatThaiDateTime(new Date().toISOString())
  
  const sections = [
    '# รายงานข้อมูลสัตว์ - ระบบ JAOTHUI E-ID',
    `# วันที่สร้างรายงาน: ${currentDate}`,
    '',
    '## ข้อมูลพื้นฐาน',
    generateAnimalBasicCSV(animal),
    '',
    '## ประวัติกิจกรรม',
    generateAnimalActivitiesCSV(animal),
    '',
    `# สิ้นสุดรายงาน - สัตว์: ${animal.name} (${animal.microchip || 'ไม่มีไมโครชิป'})`,
  ]
  
  return sections.join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 to ensure Thai characters display correctly in Excel
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent
  
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Generate filename for animal CSV export
 */
export function generateAnimalCSVFilename(animal: AnimalExportData, type: 'basic' | 'activities' | 'report' = 'report'): string {
  const date = new Date()
  const buddhistYear = toBuddhistYear(date.getFullYear())
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  
  const animalName = animal.name.replace(/[^a-zA-Z0-9ก-ฮะ-์]/g, '_')
  const microchip = animal.microchip ? `_${animal.microchip}` : ''
  
  const typeMap = {
    'basic': 'ขอมูลพื้นฐาน',
    'activities': 'ประวัติกิจกรรม', 
    'report': 'รายงานสมบูรณ์',
  }
  
  return `สัตว์_${animalName}${microchip}_${typeMap[type]}_${buddhistYear}${month}${day}.csv`
}