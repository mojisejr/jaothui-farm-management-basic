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
  },

  // Additional Health & Treatment Templates
  {
    id: 'antibiotic_treatment',
    title: 'ให้ยาปฏิชีวนะ',
    description: 'ให้ยาปฏิชีวนะสำหรับการรักษา',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '💊',
    isSchedulable: true,
    defaultDuration: 25,
    requiredFields: ['medicineType', 'dose', 'reason'],
    tips: [
      'ใช้ยาตามคำแนะนำของสัตวแพทย์',
      'ปฏิบัติตามระยะ withdrawal period',
      'บันทึกวันที่ให้และขนาดยา'
    ]
  },
  {
    id: 'vitamin_injection',
    title: 'ฉีดวิตามิน',
    description: 'ฉีดวิตามินเสริมสร้างภูมิคุ้มกัน',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '💉',
    isSchedulable: true,
    defaultDuration: 20,
    requiredFields: ['vitaminType', 'dose'],
    tips: [
      'เลือกวิตามินที่เหมาะกับอายุและสภาพสัตว์',
      'ใช้เข็มใหม่ที่ปลอดเชื้อ',
      'สังเกตอาการแพ้หลังฉีด'
    ]
  },
  {
    id: 'wound_care',
    title: 'ดูแลบาดแผล',
    description: 'ทำความสะอาดและดูแลบาดแผล',
    category: ACTIVITY_CATEGORIES[0], // health
    icon: '🩹',
    isSchedulable: true,
    defaultDuration: 45,
    requiredFields: ['woundLocation', 'severity'],
    tips: [
      'ทำความสะอาดบาดแผลด้วยน้ำเกลือ',
      'ใช้ยาฆ่าเชื้อที่เหมาะสม',
      'เปลี่ยนผ้าพันแผลทุกวัน'
    ]
  },

  // Additional Feeding Templates
  {
    id: 'special_diet',
    title: 'ให้อาหารพิเศษ',
    description: 'ให้อาหารสำหรับสัตว์ป่วยหรือมีความต้องการพิเศษ',
    category: ACTIVITY_CATEGORIES[1], // feeding
    icon: '🍯',
    isSchedulable: true,
    defaultDuration: 60,
    requiredFields: ['dietType', 'reason', 'amount'],
    tips: [
      'ปรึกษาสัตวแพทย์เรื่องสูตรอาหาร',
      'แยกให้อาหารต่างหากจากสัตว์อื่น',
      'สังเกตการตอบสนองต่ออาหาร'
    ]
  },
  {
    id: 'supplement_feeding',
    title: 'ให้อาหารเสริม',
    description: 'ให้วิตามินหรือแร่ธาตุเสริม',
    category: ACTIVITY_CATEGORIES[1], // feeding
    icon: '🥗',
    isSchedulable: true,
    defaultDuration: 30,
    requiredFields: ['supplementType', 'amount'],
    tips: [
      'คำนวณปริมาณตามน้ำหนักตัว',
      'ผสมกับอาหารหลักให้เรียบร้อย',
      'เก็บอาหารเสริมในที่แห้งและเย็น'
    ]
  },

  // Additional Breeding Templates
  {
    id: 'heat_detection',
    title: 'ตรวจสอบการเป็นสัด',
    description: 'สังเกตและบันทึกอาการเป็นสัดของตัวเมีย',
    category: ACTIVITY_CATEGORIES[2], // breeding
    icon: '🌡️',
    isSchedulable: true,
    defaultDuration: 20,
    requiredFields: ['heatLevel', 'observations'],
    tips: [
      'สังเกตพฤติกรรมและการเปลี่ยนแปลงทางกาย',
      'บันทึกเวลาที่แม่นยำ',
      'เตรียมความพร้อมสำหรับการผสมพันธุ์'
    ]
  },
  {
    id: 'birth_assistance',
    title: 'ช่วยคลอด',
    description: 'ให้ความช่วยเหลือระหว่างการคลอด',
    category: ACTIVITY_CATEGORIES[2], // breeding
    icon: '👶',
    isSchedulable: false,
    defaultDuration: 240,
    requiredFields: ['birthTime', 'complications', 'offspringCount'],
    tips: [
      'เตรียมอุปกรณ์ช่วยคลอดให้พร้อม',
      'ติดต่อสัตวแพทย์หากมีภาวะแทรกซ้อน',
      'ดูแลแม่และลูกหลังคลอด'
    ]
  },

  // Additional Hygiene Templates
  {
    id: 'hoof_trimming',
    title: 'ตัดเล็บ/กีบ',
    description: 'ตัดแต่งเล็บหรือกีบให้เรียบร้อย',
    category: ACTIVITY_CATEGORIES[3], // hygiene
    icon: '✂️',
    isSchedulable: true,
    defaultDuration: 30,
    tips: [
      'ใช้อุปกรณ์ที่สะอาดและคม',
      'ตัดอย่างระมัดระวังไม่ให้เลือดออก',
      'ตรวจสอบการติดเชื้อหรือบาดแผล'
    ]
  },
  {
    id: 'parasite_spray',
    title: 'พ่นยากำจัดปรสิต',
    description: 'พ่นยากำจัดปรสิตภายนอก',
    category: ACTIVITY_CATEGORIES[3], // hygiene
    icon: '💨',
    isSchedulable: true,
    defaultDuration: 40,
    requiredFields: ['pesticideType', 'concentration'],
    tips: [
      'ใช้ยาที่ปลอดภัยสำหรับสัตว์',
      'หลีกเลี่ยงการพ่นในวันที่มีลมแรง',
      'สวมอุปกรณ์ป้องกันส่วนบุคคล'
    ]
  },

  // Additional Monitoring Templates
  {
    id: 'temperature_check',
    title: 'วัดอุณหภูมิ',
    description: 'วัดและบันทึกอุณหภูมิร่างกาย',
    category: ACTIVITY_CATEGORIES[4], // monitoring
    icon: '🌡️',
    isSchedulable: true,
    defaultDuration: 10,
    requiredFields: ['temperature', 'method'],
    tips: [
      'วัดในเวลาเดียวกันทุกวัน',
      'ใช้เทอร์โมมิเตอร์ที่ถูกต้อง',
      'บันทึกผลพร้อมเวลาที่วัด'
    ]
  },
  {
    id: 'milk_production_check',
    title: 'บันทึกผลผลิตนม',
    description: 'วัดและบันทึกปริมาณน้ำนม',
    category: ACTIVITY_CATEGORIES[4], // monitoring
    icon: '🥛',
    isSchedulable: true,
    defaultDuration: 15,
    requiredFields: ['milkVolume', 'milkQuality'],
    tips: [
      'วัดปริมาณนมทุกครั้งที่รีด',
      'ตรวจสอบคุณภาพและสี',
      'เก็บข้อมูลสำหรับการวิเคราะห์'
    ]
  },

  // Additional Training Templates
  {
    id: 'leash_training',
    title: 'ฝึกเดินตาม',
    description: 'ฝึกให้สัตว์เดินตามคนเลี้ยง',
    category: ACTIVITY_CATEGORIES[5], // training
    icon: '🦮',
    isSchedulable: true,
    defaultDuration: 90,
    tips: [
      'เริ่มฝึกในระยะทางสั้นๆ',
      'ใช้ขนมหรือของรางวัลเป็นแรงจูงใจ',
      'อดทนและฝึกอย่างสม่ำเสมอ'
    ]
  },

  // Additional Maintenance Templates
  {
    id: 'fence_repair',
    title: 'ซ่อมแซมรั้ว',
    description: 'ตรวจสอบและซ่อมแซมรั้วคอก',
    category: ACTIVITY_CATEGORIES[6], // maintenance
    icon: '🔨',
    isSchedulable: true,
    defaultDuration: 120,
    requiredFields: ['damageType', 'location'],
    tips: [
      'ตรวจสอบรั้วทั้งหมดเป็นระยะ',
      'ใช้วัสดุคุณภาพดีในการซ่อม',
      'ตรวจสอบความปลอดภัยหลังซ่อม'
    ]
  },
  {
    id: 'water_system_check',
    title: 'ตรวจสอบระบบน้ำ',
    description: 'ตรวจสอบและดูแลระบบน้ำดื่ม',
    category: ACTIVITY_CATEGORIES[6], // maintenance
    icon: '💧',
    isSchedulable: true,
    defaultDuration: 60,
    tips: [
      'ตรวจสอบการไหลของน้ำ',
      'ทำความสะอาดท่อและถัง',
      'ตรวจสอบคุณภาพน้ำเป็นระยะ'
    ]
  },

  // Seasonal and Farm-specific Templates
  {
    id: 'heat_stress_prevention',
    title: 'ป้องกันความร้อน',
    description: 'จัดการเพื่อป้องกันสัตว์เครียดจากความร้อน',
    category: ACTIVITY_CATEGORIES[7], // other
    icon: '🌞',
    isSchedulable: true,
    defaultDuration: 45,
    tips: [
      'จัดหาร่มเงาและการระบายอากาศ',
      'เพิ่มปริมาณน้ำดื่ม',
      'หลีกเลี่ยงการทำงานในเวลาที่อากาศร้อน'
    ]
  },
  {
    id: 'rainy_season_prep',
    title: 'เตรียมความพร้อมฤดูฝน',
    description: 'เตรียมฟาร์มสำหรับฤดูฝน',
    category: ACTIVITY_CATEGORIES[6], // maintenance
    icon: '🌧️',
    isSchedulable: true,
    defaultDuration: 180,
    tips: [
      'ตรวจสอบการระบายน้ำ',
      'ซ่อมแซมหลังคาและผนัง',
      'เตรียมสถานที่พักพิงแห้ง'
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

export function getSchedulableTemplates(): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(template => template.isSchedulable)
}

export function getTemplatesByDuration(maxDuration: number): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(template => 
    template.defaultDuration && template.defaultDuration <= maxDuration
  )
}

export function getTemplatesWithRequiredFields(): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(template => 
    template.requiredFields && template.requiredFields.length > 0
  )
}

export function searchTemplates(query: string): ActivityTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ACTIVITY_TEMPLATES.filter(template => 
    template.title.toLowerCase().includes(lowerQuery) ||
    template.description?.toLowerCase().includes(lowerQuery) ||
    template.category.name.toLowerCase().includes(lowerQuery)
  )
}

export function getTemplateStatistics() {
  const stats = {
    totalTemplates: ACTIVITY_TEMPLATES.length,
    totalCategories: ACTIVITY_CATEGORIES.length,
    schedulableTemplates: getSchedulableTemplates().length,
    templatesWithRequiredFields: getTemplatesWithRequiredFields().length,
    averageDuration: 0,
    categoryBreakdown: {} as Record<string, number>
  }

  // Calculate average duration
  const templatesWithDuration = ACTIVITY_TEMPLATES.filter(t => t.defaultDuration)
  if (templatesWithDuration.length > 0) {
    const totalDuration = templatesWithDuration.reduce((sum, t) => sum + (t.defaultDuration || 0), 0)
    stats.averageDuration = Math.round(totalDuration / templatesWithDuration.length)
  }

  // Category breakdown
  ACTIVITY_CATEGORIES.forEach(category => {
    stats.categoryBreakdown[category.name] = getTemplatesByCategory(category.id).length
  })

  return stats
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