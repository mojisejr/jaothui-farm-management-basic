// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const types = [
    'ควาย',
    'หมู',
    'ไก่ชน',
    'ไก่เนื้อ',
    'ไก่ไข่',
    'เป็ด',
    'ห่าน',
    'วัว',
  ]

  for (const name of types) {
    await prisma.animalType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('✅ Animal types seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
