import type { IndexingConfig } from "@zodecode/zode-indexing/config"

type Auth = unknown

type Env = {
  ZODE_API_KEY?: string
  ZODE_ORG_ID?: string
}

type Provider = {
  key?: unknown
  options?: Record<string, unknown>
}

export type ZodeIndexingAuth = {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
}

const providers = [
  "openai",
  "ollama",
  "openai-compatible",
  "gemini",
  "mistral",
  "vercel-ai-gateway",
  "bedrock",
  "openrouter",
  "voyage",
]

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return
  const trimmed = value.trim()
  return trimmed || undefined
}

function token(auth: Auth): string | undefined {
  const data = record(auth)
  if (data.type === "api") return text(data.key)
  if (data.type === "oauth") return text(data.access)
  return
}

function org(auth: Auth): string | undefined {
  const data = record(auth)
  if (data.type === "oauth") return text(data.accountId)
  return
}

function value(input: unknown): boolean {
  if (input === undefined || input === null) return false
  if (typeof input === "string") return input.trim().length > 0
  if (typeof input === "object") return Object.values(input).some(value)
  return true
}

function hasOtherProvider(indexing: unknown): boolean {
  const cfg = record(indexing)
  return providers.some((provider) => value(cfg[provider]))
}

export function resolveZodeIndexingAuth(input: {
  config?: unknown
  provider?: Provider
  auth?: Auth
  env?: Env
}): ZodeIndexingAuth {
  const config = record(input.config)
  const options = record(record(config.provider).zode)
  const provider = input.provider ?? record(input.provider)
  const providerOptions = record(provider.options)
  const providerConfig = record(options.options)
  const zode = record(record(config.indexing).zode)
  const env = input.env ?? process.env

  return {
    apiKey:
      text(zode.apiKey) ??
      text(providerConfig.apiKey) ??
      token(input.auth) ??
      text(provider.key) ??
      text(providerOptions.zodecodeToken) ??
      text(env.ZODE_API_KEY),
    baseUrl: text(zode.baseUrl) ?? text(providerConfig.baseURL) ?? text(providerConfig.baseUrl),
    organizationId:
      text(zode.organizationId) ??
      text(providerConfig.zodecodeOrganizationId) ??
      org(input.auth) ??
      text(providerOptions.zodecodeOrganizationId) ??
      text(env.ZODE_ORG_ID),
  }
}

export function hasZodeIndexingAuth(input: Parameters<typeof resolveZodeIndexingAuth>[0]): boolean {
  return !!resolveZodeIndexingAuth(input).apiKey
}

export function shouldDefaultIndexingToZode(indexing: unknown, auth: ZodeIndexingAuth): boolean {
  const cfg = record(indexing)
  if (cfg.provider !== undefined || !auth.apiKey) return false
  return !hasOtherProvider(cfg)
}

export function indexingWithZodeDefault(
  indexing: IndexingConfig | undefined,
  auth: ZodeIndexingAuth,
): IndexingConfig | undefined {
  if (!shouldDefaultIndexingToZode(indexing, auth)) return indexing
  return { ...indexing, provider: "zode" }
}
