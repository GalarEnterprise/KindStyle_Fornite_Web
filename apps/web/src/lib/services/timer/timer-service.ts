import { Queue } from 'bullmq'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db/client'
import {
  calculateEligibilityAt,
  getTimerJobKey,
  TIMER_QUEUE_NAME,
  DEFAULT_FRIENDSHIP_PERIOD_HOURS,
} from '@kindstyle/shared'

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}

let timerQueue: Queue | null = null

export function getTimerQueue(): Queue {
  if (!timerQueue) {
    timerQueue = new Queue(TIMER_QUEUE_NAME, {
      connection: REDIS_CONNECTION,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  }
  return timerQueue
}

export async function startTimer(
  botRowId: string,
  friendshipRequestId: string,
  userId: string
): Promise<{ eligibilityAt: Date; jobScheduled: boolean }> {
  const row = await db.friendshipRequestBot.findUnique({
    where: { id: botRowId },
    include: { fulfillment_account: { select: { name: true } } },
  })

  if (!row) {
    throw new Error('Bot assignment not found')
  }

  if (row.friendship_status !== 'ACCEPTED') {
    throw new Error('Friendship not confirmed')
  }

  if (!row.friendship_confirmed_at) {
    throw new Error('Friendship confirmation date missing')
  }

  const eligibilityAt = calculateEligibilityAt(row.friendship_confirmed_at)

  await db.friendshipRequestBot.update({
    where: { id: botRowId },
    data: { eligibility_at: eligibilityAt },
  })

  const queue = getTimerQueue()
  const jobKey = getTimerJobKey(row.fulfillment_account_id, friendshipRequestId)
  const delayMs = eligibilityAt.getTime() - Date.now()

  if (delayMs > 0) {
    await queue.add(
      'timer-completed',
      {
        botRowId,
        botName: row.fulfillment_account.name,
        friendshipRequestId,
        userId,
        eligibilityAt: eligibilityAt.toISOString(),
      },
      {
        jobId: jobKey,
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    )
  }

  await db.eventLog.create({
    data: {
      entity: 'FRIENDSHIP_REQUEST_BOT',
      entity_id: botRowId,
      event_type: 'TIMER_STARTED',
      user_id: userId,
      metadata: {
        eligibility_at: eligibilityAt.toISOString(),
        job_key: jobKey,
      } as Prisma.InputJsonValue,
    },
  })

  await db.notification.create({
    data: {
      user_id: userId,
      type: 'TIMER_STARTED',
      channel: 'WEB',
      title: 'Bot preparado',
      message: `Bot ${row.fulfillment_account.name} preparado. Período de espera iniciado.`,
      metadata: {
        bot_name: row.fulfillment_account.name,
        eligibility_at: eligibilityAt.toISOString(),
      } as Prisma.InputJsonValue,
    },
  })

  return { eligibilityAt, jobScheduled: delayMs > 0 }
}

export async function getEligibilityStatus(friendshipRequestId: string) {
  const bots = await db.friendshipRequestBot.findMany({
    where: {
      friendship_request_id: friendshipRequestId,
      friendship_status: 'ACCEPTED',
    },
    include: {
      fulfillment_account: { select: { id: true, name: true, platform: true } },
    },
  })

  const now = new Date()

  return bots.map((bot) => {
    const isEligible = bot.eligibility_at ? bot.eligibility_at <= now : false
    const remainingSeconds = bot.eligibility_at
      ? Math.max(0, Math.floor((bot.eligibility_at.getTime() - now.getTime()) / 1000))
      : 0

    return {
      id: bot.id,
      bot_id: bot.fulfillment_account_id,
      bot_name: bot.fulfillment_account.name,
      bot_platform: bot.fulfillment_account.platform,
      eligibility_at: bot.eligibility_at,
      remaining_seconds: remainingSeconds,
      is_eligible: isEligible,
    }
  })
}

export async function recoverTimers(): Promise<number> {
  const now = new Date()

  const staleTimers = await db.friendshipRequestBot.findMany({
    where: {
      friendship_status: 'ACCEPTED',
      eligibility_at: { not: null, lte: now },
    },
    include: {
      fulfillment_account: { select: { name: true } },
    },
  })

  const queue = getTimerQueue()

  let recovered = 0
  for (const bot of staleTimers) {
    const existingJob = await queue.getJob(
      getTimerJobKey(bot.fulfillment_account_id, bot.friendship_request_id)
    )

    if (!existingJob) {
      await queue.add(
        'timer-completed',
        {
          botRowId: bot.id,
          botName: bot.fulfillment_account.name,
          friendshipRequestId: bot.friendship_request_id,
          userId: null,
          eligibilityAt: bot.eligibility_at!.toISOString(),
        },
        {
          jobId: getTimerJobKey(bot.fulfillment_account_id, bot.friendship_request_id),
          delay: 0,
        }
      )
      recovered++
    }
  }

  return recovered
}
