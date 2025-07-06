/**
 * Activity templates and categories for Thai farm management
 */

export interface ActivityTemplate {
  id: string
  title: string
  description?: string
  category: ActivityCategory
  icon: string
  isSchedulable: boolean
  defaultDuration?: number // minutes
  requiredFields?: string[]
  tips?: string[]
}

export interface ActivityCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

// Activity Categories
export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: 'health',
    name: 'สุขภาพและการรักษา',
    description: 'กิจกรรมเกี่ยวกับการดูแลสุขภาพ การฉีดวัคซีน และการรักษา',
    icon: '🏥',
    color: 'text-success'
  },
  {
    id: 'feeding',
    name: 'การให้อาหาร',
    description: 'กิจกรรมเกี่ยวกับการให้อาหาร การควบคุมน้ำหนัก และโภชนาการ',
    icon: '🌾',
    color: 'text-warning'
  },
  {
    id: 'breeding',
    name: 'การผสมพันธุ์',
    description: 'กิจกรรมเกี่ยวกับการผสมพันธุ์ การตั้งท้อง และการคลอด',
    icon: '💕',
    color: 'text-error'
  },
  {
    id: 'hygiene',
    name: 'การทำความสะอาด',
    description: 'กิจกรรมเกี่ยวกับการทำความสะอาดคอก การอาบน้ำ และการดูแลสุขอนามัย',
    icon: '🧽',
    color: 'text-info'
  },
  {
    id: 'monitoring',
    name: 'การตรวจสอบ',
    description: 'กิจกรรมเกี่ยวกับการตรวจสอบสุขภาพ การชั่งน้ำหนัก และการตรวจวัด',
    icon: '📊',
    color: 'text-primary'
  },
  {
    id: 'training',
    name: 'การฝึก',
    description: 'กิจกรรมเกี่ยวกับการฝึกสัตว์ การปรับพฤติกรรม และการเลี้ยงดู',
    icon: '🎯',
    color: 'text-secondary'
  },
  {
    id: 'maintenance',
    name: 'การบำรุงรักษา',
    description: 'กิจกรรมเกี่ยวกับการบำรุงรักษาอุปกรณ์ คอก และสิ่งแวดล้อม',
    icon: '🔧',
    color: 'text-neutral'
  },
  {
    id: 'other',
    name: 'อื่นๆ',
    description: 'กิจกรรมอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น',
    icon: '📝',
    color: 'text-base-content'
  }
]

// Activity Templates
export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  // Health & Treatment
  {
    id: 'vaccination',
    title: 'ฉีดวัคซีน',
    description: 'บันทึกการฉีดวัคซีนป้องกันโรค',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '💉',
    isSchedulable: true,
    defaultDuration: 30,
    requiredFields: ['vaccineType', 'dose'],
    tips: [
      'ควรฉีดวัคซีนตามกำหนดเวลาที่สัตวแพทย์แนะนำ',
      'สังเกตอาการหลังฉีดวัคซีน 24 ชั่วโมง',
      'บันทึกชื่อวัคซีนและล็อตที่ฉีด'
    ]
  },
  {
    id: 'health_check',
    title: 'ตรวจสุขภาพ',
    description: 'ตรวจสอบสุขภาพทั่วไปของสัตว์',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '🩺',
    isSchedulable: true,
    defaultDuration: 15,
    tips: [
      'ตรวจดูตา จมูก ปาก และหู',
      'สังเกตพฤติกรรมการกินและการเคลื่อนไหว',
      'วัดอุณหภูมิร่างกายหากจำเป็น'
    ]
  },
  {
    id: 'deworming',
    title: 'ให้ยาถ่ายพยาธิ',
    description: 'ให้ยาถ่ายพยาธิตามกำหนด',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '💊',
    isSchedulable: true,
    defaultDuration: 20,
    requiredFields: ['medicineType', 'dose'],
    tips: [
      'ให้ยาตามน้ำหนักตัวที่แนะนำ',
      'สังเกตอาการข้างเคียงหลังให้ยา',
      'จดบันทึกวันที่ให้และครั้งต่อไป'
    ]
  },

  // Feeding
  {
    id: 'regular_feeding',
    title: 'ให้อาหารปกติ',
    description: 'ให้อาหารมื้อปกติประจำวัน',
    category: ACTIVITY_CATEGORIES[1], // feeding
    icon: '🥬',
    isSchedulable: true,
    defaultDuration: 45,
    requiredFields: ['foodType', 'amount'],
    tips: [
      'ให้อาหารในปริมาณที่เหมาะสมกับน้ำหนักตัว',
      'ตรวจสอบคุณภาพอาหารก่อนให้',
      'สังเกตพฤติกรรมการกินอาหาร'
    ]
  },
  {
    id: 'weight_measurement',
    title: 'ชั่งน้ำหนัก',
    description: 'วัดและบันทึกน้ำหนักตัว',
    category: ACTIVITY_CATEGORIES[4], // monitoring
    icon: '⚖️',
    isSchedulable: true,
    defaultDuration: 10,
    requiredFields: ['weight'],
    tips: [
      'ชั่งน้ำหนักในเวลาเดียวกันทุกครั้ง',
      'ใช้เครื่องชั่งที่มีความแม่นยำ',
      'บันทึกผลเปรียบเทียบกับครั้งก่อน'
    ]
  },

  // Breeding
  {
    id: 'artificial_insemination',
    title: 'ผสมเทียม',
    description: 'ทำการผสมเทียม',
    category: ACTIVITY_CATEGORIES[2], // breeding
    icon: '🧬',
    isSchedulable: true,
    defaultDuration: 60,
    requiredFields: ['sireId', 'technique'],
    tips: [
      'เลือกเวลาที่เหมาะสมสำหรับการผสม',
      'ใช้อุปกรณ์ที่สะอาดและปลอดเชื้อ',
      'บันทึกข้อมูลพ่อพันธุ์ที่ใช้'
    ]
  },
  {
    id: 'pregnancy_check',
    title: 'ตรวจการตั้งท้อง',
    description: 'ตรวจสอบการตั้งท้องหลังผสมพันธุ์',
    category: ACTIVITY_CATEGORIES[2], // breeding
    icon: '🤰',
    isSchedulable: true,
    defaultDuration: 30,
    tips: [
      'ตรวจหลังผสมพันธุ์ 30-60 วัน',
      'สังเกตอาการและพฤติกรรมเปลี่ยนแปลง',
      'ปรึกษาสัตวแพทย์หากมีข้อสงสัย'
    ]
  },

  // Hygiene
  {
    id: 'pen_cleaning',
    title: 'ทำความสะอาดคอก',
    description: 'ทำความสะอาดคอกเลี้ยงสัตว์',
    category: ACTIVITY_CATEGORIES[3], // hygiene
    icon: '🧹',
    isSchedulable: true,
    defaultDuration: 120,
    tips: [
      'เคลื่อนย้ายสัตว์ออกจากคอกก่อนทำความสะอาด',
      'ใช้น้ำยาฆ่าเชื้อที่เหมาะสม',
      'ตรวจสอบความเรียบร้อยของอุปกรณ์'
    ]
  },
  {
    id: 'bathing',
    title: 'อาบน้ำ',
    description: 'อาบน้ำให้สัตว์',
    category: ACTIVITY_CATEGORIES[3], // hygiene
    icon: '🚿',
    isSchedulable: true,
    defaultDuration: 45,
    tips: [
      'ใช้น้ำอุณหภูมิที่เหมาะสม',
      'เลือกแชมพูที่เหมาะกับชนิดสัตว์',
      'เช็ดให้แห้งหลังอาบน้ำ'
    ]
  },

  // Training
  {
    id: 'basic_training',
    title: 'ฝึกพื้นฐาน',
    description: 'ฝึกพฤติกรรมพื้นฐานของสัตว์',
    category: ACTIVITY_CATEGORIES[5], // training
    icon: '🎓',
    isSchedulable: true,
    defaultDuration: 60,
    tips: [
      'ใช้ระบบรางวัลในการฝึก',
      'ฝึกในช่วงเวลาที่สัตว์มีสมาธิ',
      'ควรฝึกอย่างสม่ำเสมอ'
    ]
  },

  // Maintenance
  {
    id: 'equipment_check',
    title: 'ตรวจสอบอุปกรณ์',
    description: 'ตรวจสอบและบำรุงรักษาอุปกรณ์',
    category: ACTIVITY_CATEGORIES[6], // maintenance
    icon: '🔍',
    isSchedulable: true,
    defaultDuration: 90,
    tips: [
      'ตรวจสอบอุปกรณ์ให้อาหารและน้ำ',
      'ซ่อมแซมหรือเปลี่ยนอุปกรณ์ที่ชำรุด',
      'ทำความสะอาดอุปกรณ์เป็นประจำ'
    ]
  },

  // Other
  {
    id: 'transport',
    title: 'ขนส่งสัตว์',
    description: 'ขนส่งสัตว์ไปยังสถานที่อื่น',
    category: ACTIVITY_CATEGORIES[7], // other
    icon: '🚛',
    isSchedulable: true,
    defaultDuration: 180,
    requiredFields: ['destination', 'purpose'],
    tips: [
      'เตรียมอุปกรณ์ขนส่งที่เหมาะสม',
      'ตรวจสอบสุขภาพก่อนขนส่ง',
      'จัดเตรียมเอกสารที่จำเป็น'
    ]
  }
]

// Helper functions
export function getTemplatesByCategory(categoryId: string): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(template => template.category.id === categoryId)
}

export function getTemplateById(id: string): ActivityTemplate | undefined {
  return ACTIVITY_TEMPLATES.find(template => template.id === id)
}

export function getCategoryById(id: string): ActivityCategory | undefined {
  return ACTIVITY_CATEGORIES.find(category => category.id === id)
}

// Recurrence types for schedules
export const RECURRENCE_TYPES = [
  { id: 'none', name: 'ไม่ซ้ำ', description: 'ทำเพียงครั้งเดียว' },
  { id: 'daily', name: 'รายวัน', description: 'ทำทุกวัน' },
  { id: 'weekly', name: 'รายสัปดาห์', description: 'ทำทุกสัปดาห์' },
  { id: 'monthly', name: 'รายเดือน', description: 'ทำทุกเดือน' },
  { id: 'quarterly', name: 'รายไตรมาส', description: 'ทำทุก 3 เดือน' },
  { id: 'yearly', name: 'รายปี', description: 'ทำทุกปี' }
] as const

export type RecurrenceType = typeof RECURRENCE_TYPES[number]['id']