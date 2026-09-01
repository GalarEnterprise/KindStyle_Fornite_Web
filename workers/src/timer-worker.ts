import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { Prisma } from '@prisma/client'
import { getTimerJobKey, TIMER_QUEUE_NAME } from '@kindstyle/shared'

interface TimerJobData {
  botRowId: string
  botName: string
  friendshipRequestId: string
  userId: string | null
  eligibilityAt: string
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export class TimerWorker {
  private worker: Worker | null = null
  private redis: IORedis | null = null

  async start() {
    this.redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

    this.worker = new Worker(
      TIMER_QUEUE_NAME,
      async (job: Job<TimerJobData>) => {
        console.log(`[TimerWorker] Processing timer for bot: ${job.data.botName}`)

        try {
          await this.processTimerCompletion(job.data)
          console.log(`[TimerWorker] Timer completed for bot: ${job.data.botName}`)
        } catch (error) {
          console.error(`[TimerWorker] Error processing timer for bot ${job.data.botName}:`, error)
          throw error
        }
      },
      {
        connection: this.redis,
        concurrency: 5,
        lockDuration: 30000,
        lockRenewTime: 15000,
      }
    )

    this.worker.on('completed', (job) => {
      console.log(`[TimerWorker] Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`[TimerWorker] Job ${job?.id} failed:`, err.message)
    })

    console.log('[TimerWorker] Started')
  }

  async stop() {
    if (this.worker) {
      await this.worker.close()
      this.worker = null
    }
    if (this.redis) {
      this.redis.disconnect()
      this.redis = null
    }
    console.log('[TimerWorker] Stopped')
  }

  private async processTimerCompletion(data: TimerJobData) {
    const { botRowId, botName, friendshipRequestId, userId, eligibilityAt } = data

    const { PrismaClient } = await import('@prisma/client')
    const db = new PrismaClient()

    try {
      const row = await db.friendshipRequestBot.findUnique({
        where: { id: botRowId },
      })

      if (!row) {
        console.warn(`[TimerWorker] Bot row ${botRowId} not found, skipping`)
        return
      }

      if (row.eligibility_at && row.eligibility_at <= new Date()) {
        await db.eventLog.create({
          data: {
            entity: 'FRIENDSHIP_REQUEST_BOT',
            entity_id: botRowId,
            event_type: 'BOT_TIMER_COMPLETED',
            user_id: userId,
            metadata: {
              bot_name: botName,
              eligibility_at: eligibilityAt,
              completed_at: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        })

        if (userId) {
          await db.notification.create({
            data: {
              user_id: userId,
              type: 'TIMER_COMPLETED',
              channel: 'WEB',
              title: 'Bot elegible',
              message: `Bot ${botName} elegible para enviarte regalos.`,
              metadata: {
                bot_name: botName,
                completed_at: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          })

          console.log(`[TimerWorker] Timer completed for bot ${botName}, user ${userId}`)
        }
      } else {
        console.log(`[TimerWorker] Bot ${botName} already processed or not eligible yet`)
      }
    } finally {
      await db.$disconnect()
    }
  }
}
