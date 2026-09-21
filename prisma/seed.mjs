import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const password = 'password123'; // Para el prototipo

  const bruno = await prisma.usuario.upsert({
    where: { nombre: 'Bruno' },
    update: {},
    create: {
      nombre: 'Bruno',
      password,
    },
  })

  const soraya = await prisma.usuario.upsert({
    where: { nombre: 'Soraya' },
    update: {},
    create: {
      nombre: 'Soraya',
      password,
    },
  })

  console.log({ bruno, soraya })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
