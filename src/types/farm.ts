// src/types/farm.ts
// Thai provinces list and Zod schemas for farm-related forms
import { z } from 'zod'

// Exported once so both client & server code can share
export const THAI_PROVINCES = [
  'กรุงเทพมหานคร',
  'สมุทรปราการ',
  'นนทบุรี',
  'ปทุมธานี',
  'พระนครศรีอยุธยา',
  'อ่างทอง',
  'ลพบุรี',
  'สิงห์บุรี',
  'ชัยนาท',
  'สระบุรี',
  'ชลบุรี',
  'ระยอง',
  'จันทบุรี',
  'ตราด',
  'ฉะเชิงเทรา',
  'ปราจีนบุรี',
  'นครนายก',
  'สระแก้ว',
  'นครราชสีมา',
  'บุรีรัมย์',
  'สุรินทร์',
  'ศรีสะเกษ',
  'อุบลราชธานี',
  'ยโสธร',
  'ชัยภูมิ',
  'อำนาจเจริญ',
  'หนองบัวลำภู',
  'ขอนแก่น',
  'อุดรธานี',
  'เลย',
  'หนองคาย',
  'มหาสารคาม',
  'ร้อยเอ็ด',
  'กาฬสินธุ์',
  'สกลนคร',
  'นครพนม',
  'มุกดาหาร',
  'เชียงใหม่',
  'ลำพูน',
  'ลำปาง',
  'อุตรดิตถ์',
  'แพร่',
  'น่าน',
  'พะเยา',
  'เชียงราย',
  'แม่ฮ่องสอน',
  'นครสวรรค์',
  'อุทัยธานี',
  'กำแพงเพชร',
  'ตาก',
  'สุโขทัย',
  'พิษณุโลก',
  'พิจิตร',
  'เพชรบูรณ์',
  'ราชบุรี',
  'กาญจนบุรี',
  'สุพรรณบุรี',
  'นครปฐม',
  'สมุทรสาคร',
  'สมุทรสงคราม',
  'เพชรบุรี',
  'ประจวบคีรีขันธ์',
  'นครศรีธรรมราช',
  'กระบี่',
  'พังงา',
  'ภูเก็ต',
  'สุราษฎร์ธานี',
  'ระนอง',
  'ชุมพร',
  'สงขลา',
  'สตูล',
  'ตรัง',
  'พัทลุง',
  'ปัตตานี',
  'ยะลา',
  'นราธิวาส',
] as const

export const farmCreateSchema = z.object({
  name: z
    .string({ required_error: 'กรุณากรอกชื่อฟาร์ม' })
    .trim()
    .min(3, { message: 'ชื่อฟาร์มต้องมีอย่างน้อย 3 ตัวอักษร' }),
  province: z.enum(THAI_PROVINCES, {
    errorMap: () => ({ message: 'กรุณาเลือกจังหวัดที่ถูกต้อง' }),
  }),
  size: z
    .number({ required_error: 'กรุณากรอกขนาดพื้นที่' })
    .min(0.1, { message: 'ขนาดพื้นที่ต้องมากกว่า 0.1 ไร่' })
    .max(10000, { message: 'ขนาดพื้นที่ต้องไม่เกิน 10,000 ไร่' }),
  description: z.string().optional(),
})

export type FarmCreateData = z.infer<typeof farmCreateSchema>
