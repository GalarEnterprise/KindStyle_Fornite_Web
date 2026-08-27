import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      notification_prefs: null,
    },
    select: { id: true },
  })

  console.log(`Found ${users.length} users without notification preferences`)

  for (const user of users) {
    await prisma.notificationPreference.create({
      data: { user_id: user.id },
    })
    console.log(`Created preferences for user ${user.id}`)
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
