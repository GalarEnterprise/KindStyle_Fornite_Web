export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface RequestNumber {
  prefix: string
  date: string
  suffix: string
  full: string
}

export interface CartItemData {
  productId: string
  quantity: number
  type: 'gift' | 'vbucks' | 'crew' | 'battlepass'
  epicCredentials?: {
    email: string
    password: string
  }
}

export interface GeneratedRequestMessage {
  plain: string
  whatsappUrl: string
}

export interface BotTimerInfo {
  botName: string
  friendshipConfirmedAt: Date | null
  eligibilityAt: Date | null
  remainingMs: number | null
  isEligible: boolean
}

export interface NotificationPayload {
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}
