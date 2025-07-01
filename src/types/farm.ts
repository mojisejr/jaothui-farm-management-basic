import { z } from 'zod'
import { thaiProvinces } from '@/constants/thaiProvinces'

export const farmSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'กรุณากรอกชื่อฟาร์มอย่างน้อย 2 ตัวอักษร',
    })
    .max(100, { message: 'ชื่อฟาร์มยาวเกินไป' }),
  province: z.string().refine((val) => thaiProvinces.includes(val), {
    message: 'กรุณาเลือกจังหวัดที่ถูกต้อง',
  }),
})

export type FarmFormData = z.infer<typeof farmSchema>
