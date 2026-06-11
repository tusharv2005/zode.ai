import { describe, expect, test } from "bun:test"
import {
  hasZodeIndexingAuth,
  resolveZodeIndexingAuth,
  shouldDefaultIndexingToZode,
} from "../../src/zodecode/indexing-auth"

describe("Zode indexing auth resolution", () => {
  test("detects auth from explicit indexing Zode config", () => {
    const auth = resolveZodeIndexingAuth({
      config: { indexing: { zode: { apiKey: "idx-token", baseUrl: "https://idx.test", organizationId: "org_idx" } } },
    })

    expect(auth).toEqual({ apiKey: "idx-token", baseUrl: "https://idx.test", organizationId: "org_idx" })
    expect(hasZodeIndexingAuth({ config: { indexing: { zode: { apiKey: "idx-token" } } } })).toBe(true)
  })

  test("detects auth from provider config, provider state, auth storage, and env", () => {
    expect(
      resolveZodeIndexingAuth({ config: { provider: { zode: { options: { apiKey: "cfg-token" } } } } }).apiKey,
    ).toBe("cfg-token")
    expect(resolveZodeIndexingAuth({ provider: { options: { zodecodeToken: "provider-token" } } }).apiKey).toBe(
      "provider-token",
    )
    expect(resolveZodeIndexingAuth({ auth: { type: "oauth", access: "oauth-token", accountId: "org_oauth" } })).toEqual(
      {
        apiKey: "oauth-token",
        organizationId: "org_oauth",
      },
    )
    expect(resolveZodeIndexingAuth({ env: { ZODE_API_KEY: "env-token", ZODE_ORG_ID: "org_env" } })).toEqual({
      apiKey: "env-token",
      organizationId: "org_env",
    })
  })

  test("defaults to Zode only when no provider or other embedder config is present", () => {
    const auth = { apiKey: "zode-token" }

    expect(shouldDefaultIndexingToZode({}, auth)).toBe(true)
    expect(shouldDefaultIndexingToZode({ provider: "openai" }, auth)).toBe(false)
    expect(shouldDefaultIndexingToZode({ openai: { apiKey: "openai-key" } }, auth)).toBe(false)
    expect(shouldDefaultIndexingToZode({ ollama: { baseUrl: "http://localhost:11434" } }, auth)).toBe(false)
  })
})
