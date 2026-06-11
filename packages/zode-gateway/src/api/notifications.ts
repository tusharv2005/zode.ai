import { z } from "zod"
import { ZODE_API_BASE } from "./constants.js"

/**
 * Zode notification schema
 */
export const ZodecodeNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  action: z
    .object({
      actionText: z.string(),
      actionURL: z.string(),
    })
    .optional(),
  showIn: z.array(z.string()).optional(),
  suggestModelId: z.string().optional(),
})

export type ZodecodeNotification = z.infer<typeof ZodecodeNotificationSchema>

const NotificationsResponseSchema = z.object({
  notifications: z.array(ZodecodeNotificationSchema),
})

const NOTIFICATIONS_TIMEOUT_MS = 5000

/**
 * Fetch notifications from Zode API
 *
 * @param options - Configuration with token and optional organization ID
 * @returns Array of notifications from the Zode API (clients filter by showIn)
 */
export async function fetchZodecodeNotifications(options: {
  zodecodeToken?: string
  zodecodeOrganizationId?: string
}): Promise<ZodecodeNotification[]> {
  const token = options.zodecodeToken
  if (!token) return []

  const url = `${ZODE_API_BASE}/api/users/notifications`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(NOTIFICATIONS_TIMEOUT_MS),
    })

    if (!response.ok) return []

    const json = await response.json()
    const result = NotificationsResponseSchema.safeParse(json)

    if (!result.success) return []

    return result.data.notifications
  } catch {
    return []
  }
}
