import { fetchBalance, fetchProfile } from "../api/profile.js"
import { fetchZodecodeNotifications } from "../api/notifications.js"
import { clearModesCache } from "../api/modes.js"
import { HEADER_ORGANIZATIONID, ZODE_API_BASE, ZODE_CHAT_URL, ZODE_EVENT_SERVICE_URL } from "../api/constants.js"
import type { ZodecodeBalance, ZodecodeProfile } from "../types.js"
import { buildZodeHeaders } from "../headers.js"

export type ZodeAuth =
  | { type: "api"; key: string }
  | { type: "oauth"; access: string; refresh: string; expires: number; accountId?: string }
  | { type: "wellknown"; key: string; token: string }

export interface ZodeProfileResult {
  profile: ZodecodeProfile
  balance: ZodecodeBalance | null
  currentOrgId: string | null
}

export interface ClawChatCredentials {
  token: string
  expiresAt: string
  zodeChatUrl: string
  eventServiceUrl: string
}

export interface AuthStore {
  get(provider: string): Promise<ZodeAuth | undefined>
  set(provider: string, auth: Extract<ZodeAuth, { type: "oauth" }>): Promise<void>
}

export interface OrganizationDeps {
  auth: AuthStore
  clear(): void | Promise<void>
  dispose(): Promise<void>
}

export interface CloudSessionsInput {
  cursor?: string
  limit?: number
  gitUrl?: string
}

export class UnauthorizedError extends Error {}

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export function getToken(auth: ZodeAuth | undefined) {
  if (auth?.type === "api") return auth.key
  if (auth?.type === "oauth") return auth.access
  return undefined
}

export function getOrganizationId(auth: ZodeAuth | undefined) {
  if (auth?.type === "oauth") return auth.accountId
  return undefined
}

export async function getProfile(auth: AuthStore): Promise<ZodeProfileResult> {
  const info = await auth.get("zode")
  if (!info || info.type !== "oauth") throw new UnauthorizedError("Not authenticated with Zode Gateway")

  const currentOrgId = info.accountId ?? null
  const [profile, balance] = await Promise.all([
    fetchProfile(info.access),
    fetchBalance(info.access, currentOrgId ?? undefined),
  ])
  return { profile, balance, currentOrgId }
}

export async function getNotifications(auth: AuthStore) {
  const info = await auth.get("zode")
  const token = getToken(info)
  if (!token) return []

  return fetchZodecodeNotifications({
    zodecodeToken: token,
    zodecodeOrganizationId: getOrganizationId(info),
  })
}

export async function setOrganization(deps: OrganizationDeps, organizationId: string | null) {
  const info = await deps.auth.get("zode")
  if (!info || info.type !== "oauth") throw new UnauthorizedError("Not authenticated with Zode Gateway")

  await deps.auth.set("zode", {
    type: "oauth",
    refresh: info.refresh,
    access: info.access,
    expires: info.expires,
    ...(organizationId && { accountId: organizationId }),
  })

  await deps.clear()
  clearModesCache()
  await deps.dispose()
  return true
}

export async function getClawStatus(auth: AuthStore) {
  const info = await auth.get("zode")
  const token = getToken(info)
  if (!token) throw new UnauthorizedError("No valid token found")

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
  const org = getOrganizationId(info)
  if (org) headers[HEADER_ORGANIZATIONID] = org

  const response = await fetch(`${ZODE_API_BASE}/api/zodeclaw/status`, { headers })
  if (!response.ok) throw new GatewayError(await response.text(), response.status)
  return response.json()
}

export async function getClawChatCredentials(auth: AuthStore): Promise<ClawChatCredentials> {
  const info = await auth.get("zode")
  const token = getToken(info)
  if (!token) throw new UnauthorizedError("No valid token found")

  const expires = info?.type === "oauth" ? info.expires : Date.now() + 365 * 24 * 60 * 60 * 1000
  return {
    token,
    expiresAt: new Date(expires).toISOString(),
    zodeChatUrl: ZODE_CHAT_URL,
    eventServiceUrl: ZODE_EVENT_SERVICE_URL,
  }
}

export async function getCloudSessions(token: string, input: CloudSessionsInput) {
  const query: Record<string, unknown> = {}
  if (input.cursor) query.cursor = input.cursor
  if (input.limit) query.limit = input.limit
  if (input.gitUrl) query.gitUrl = input.gitUrl

  const params = new URLSearchParams({
    batch: "1",
    input: JSON.stringify({ "0": query }),
  })

  const response = await fetch(`${ZODE_API_BASE}/api/trpc/cliSessionsV2.list?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...buildZodeHeaders(),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error("[Zode Gateway] cloud-sessions: tRPC request failed", {
      status: response.status,
      body: text.slice(0, 500),
    })
    throw new GatewayError(`Cloud sessions fetch failed: ${response.status}`, response.status)
  }

  const raw = await response.text()
  const json = JSON.parse(raw)
  const data = Array.isArray(json) ? json[0]?.result?.data : null
  const result = data?.json ?? data
  if (!result) return { cliSessions: [], nextCursor: null }

  const cliSessions = (result.cliSessions ?? []).map((item: any) => ({
    session_id: item.session_id,
    title: item.title ?? null,
    created_at:
      typeof item.created_at === "string"
        ? item.created_at
        : item.created_at
          ? new Date(item.created_at).toISOString()
          : new Date().toISOString(),
    updated_at:
      typeof item.updated_at === "string"
        ? item.updated_at
        : item.updated_at
          ? new Date(item.updated_at).toISOString()
          : new Date().toISOString(),
    version: item.version ?? 0,
  }))

  return { cliSessions, nextCursor: result.nextCursor ?? null }
}
