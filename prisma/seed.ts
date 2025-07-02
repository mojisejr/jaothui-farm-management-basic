// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const animalTypes = [
    { name: 'หมู', description: 'สุกร หมูเลี้ยง' },
    { name: 'ไก่', description: 'ไก่พื้นเมือง ไก่ทั่วไป' },
    { name: 'โค', description: 'โคนม โคเนื้อ' },
    { name: 'วัว', description: 'วัวนา วัวไทย' },
    { name: 'ควาย', description: 'ควายไทย ควายนา' },
    { name: 'ไก่ชน', description: 'ไก่ชนไทย ไก่ต่อสู้' },
    { name: 'เป็ด', description: 'เป็ดไข่ เป็ดเนื้อ' },
    { name: 'ห่าน', description: 'ห่านไทย ห่านเลี้ยง' },
    { name: 'ไก่เนื้อ', description: 'ไก่เนื้อ ไก่บรอยเลอร์' },
    { name: 'ไก่ไข่', description: 'ไก่ไข่ ไก่เลเยอร์' },
  ]

  for (const type of animalTypes) {
    await prisma.animalType.upsert({
      where: { name: type.name },
      update: { description: type.description },
      create: {
        name: type.name,
        description: type.description,
      },
    })
  }

  console.log('✅ Animal types seeded successfully (10 types)')
  console.log('🐷 หมู, 🐔 ไก่, 🐄 โค, 🐂 วัว, 🐃 ควาย')
  console.log('🐓 ไก่ชน, 🦆 เป็ด, 🪿 ห่าน, 🍗 ไก่เนื้อ, 🥚 ไก่ไข่')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
