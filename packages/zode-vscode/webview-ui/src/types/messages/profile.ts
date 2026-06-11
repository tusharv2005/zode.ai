// Zode notification types (mirrored from zode-gateway)
export interface ZodecodeNotificationAction {
  actionText: string
  actionURL: string
}

export interface ZodecodeNotification {
  id: string
  title: string
  message: string
  action?: ZodecodeNotificationAction
  showIn?: string[]
  suggestModelId?: string
}

// Profile types from zode-gateway
export interface ZodecodeBalance {
  balance: number
}

export interface ProfileData {
  profile: {
    email: string
    name?: string
    organizations?: Array<{ id: string; name: string; role: string }>
  }
  balance: ZodecodeBalance | null
  currentOrgId: string | null
}
