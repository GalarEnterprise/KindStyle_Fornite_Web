import { CatalogWorker } from './catalog-worker'
import { NotificationWorker } from './notification-worker'
import { FriendshipWorker } from './friendship-worker'

async function main() {
  console.log('[Workers] Starting...')

  const catalog = new CatalogWorker()
  const notification = new NotificationWorker()
  const friendship = new FriendshipWorker()

  await catalog.start()
  await notification.start()
  await friendship.start()

  console.log('[Workers] All workers running')

  process.on('SIGTERM', async () => {
    console.log('[Workers] Shutting down...')
    await catalog.stop()
    await notification.stop()
    await friendship.stop()
    process.exit(0)
  })
}

main().catch(console.error)
