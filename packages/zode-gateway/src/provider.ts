import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createAlibaba } from "@ai-sdk/alibaba"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { createMistral } from "@ai-sdk/mistral"
import type { ZodeProvider, ZodeProviderOptions } from "./types.js"
import { getApiKey } from "./auth/token.js"
import { buildZodeHeaders, getDefaultHeaders } from "./headers.js"
import { ANONYMOUS_API_KEY } from "./api/constants.js"
import { resolveZodeOpenRouterBaseUrl } from "./api/url.js"
import { sanitizeResponsesBody } from "./responses.js"

export function buildRequestHeaders(defaultHeaders: Record<string, string>, requestHeaders?: HeadersInit): Headers {
  const headers = new Headers(defaultHeaders)
  new Headers(requestHeaders).forEach((value, key) => {
    headers.set(key, value)
  })
  return headers
}

/**
 * Create a ZodeCode provider instance
 *
 * This provider wraps the OpenRouter SDK with ZodeCode-specific configuration
 * including custom authentication, headers, and base URL.
 *
 * @example
 * ```typescript
 * const provider = createZode({
 *   zodecodeToken: "your-token-here",
 *   zodecodeOrganizationId: "org-123"
 * })
 *
 * const model = provider.languageModel("anthropic/claude-sonnet-4")
 * ```
 */
export function createZode(options: ZodeProviderOptions = {}): ZodeProvider {
  // Get API key from options or environment
  const apiKey = getApiKey(options)

  const openRouterUrl = resolveZodeOpenRouterBaseUrl({ baseURL: options.baseURL, token: apiKey })

  // Merge custom headers with defaults
  const customHeaders = {
    ...getDefaultHeaders(),
    ...buildZodeHeaders(undefined, {
      zodecodeOrganizationId: options.zodecodeOrganizationId,
      zodecodeTesterWarningsDisabledUntil: undefined,
    }),
    ...options.headers,
  }

  // Create custom fetch wrapper to add dynamic headers
  const originalFetch = options.fetch ?? fetch
  const wrappedFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const headers = buildRequestHeaders(customHeaders, init?.headers)
    const body = sanitizeResponsesBody(input, init?.body)

    // Add authorization if API key exists
    if (apiKey) {
      headers.set("Authorization", `Bearer ${apiKey}`)
    }

    return originalFetch(input, {
      ...init,
      headers,
      body,
    })
  }

  const sdkOptions = {
    baseURL: openRouterUrl,
    apiKey: apiKey ?? ANONYMOUS_API_KEY,
    headers: customHeaders,
    fetch: wrappedFetch as typeof fetch,
  }

  const openrouter = createOpenRouter(sdkOptions)
  const alibaba = createAlibaba(sdkOptions)
  const anthropic = createAnthropic(sdkOptions)
  const openai = createOpenAI(sdkOptions)
  const openaiCompatible = createOpenAICompatible({ ...sdkOptions, name: "openaiCompatible" })
  const mistral = createMistral(sdkOptions)

  return {
    languageModel(modelId) {
      return openrouter(modelId)
    },
    embeddingModel(modelId: string) {
      return openrouter.textEmbeddingModel(modelId)
    },
    rerankingModel(modelId: string): never {
      throw new Error(`Reranking model not supported: ${modelId}`)
    },
    imageModel(modelId) {
      return openrouter.imageModel(modelId)
    },
    alibaba(modelId) {
      return alibaba(modelId)
    },
    anthropic(modelId) {
      return anthropic(modelId)
    },
    mistral(modelId) {
      return mistral(modelId)
    },
    openai(modelId) {
      return openai(modelId)
    },
    openaiCompatible(modelId) {
      return openaiCompatible(modelId)
    },
  }
}
