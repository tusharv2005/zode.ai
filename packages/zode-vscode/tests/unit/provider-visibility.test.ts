import { describe, expect, it } from "bun:test"

import {
  disabledProviderOptions,
  providersWithZodeFallback,
  visibleConnectedIds,
} from "../../webview-ui/src/components/settings/provider-visibility"

describe("visibleConnectedIds", () => {
  it("hides Zode from the connected list when auth is missing", () => {
    const ids = visibleConnectedIds(["zode", "openrouter"], { openrouter: "api" })

    expect(ids).toEqual(["openrouter"])
  })

  it("keeps Zode in the connected list when auth exists", () => {
    const ids = visibleConnectedIds(["zode", "openrouter"], { zode: "oauth", openrouter: "api" })

    expect(ids).toEqual(["zode", "openrouter"])
  })

  it("leaves non-Zode providers untouched", () => {
    const ids = visibleConnectedIds(["anthropic"], {})

    expect(ids).toEqual(["anthropic"])
  })
})

describe("disabledProviderOptions", () => {
  it("includes Zode and excludes already disabled providers", () => {
    const options = disabledProviderOptions(
      {
        zode: { id: "zode", name: "Zode Gateway", env: [], models: {} },
        openai: { id: "openai", name: "OpenAI", env: [], models: {} },
        anthropic: { id: "anthropic", name: "Anthropic", env: [], models: {} },
      },
      ["openai"],
    )

    expect(options).toEqual([
      { value: "anthropic", label: "Anthropic" },
      { value: "zode", label: "Zode Gateway" },
    ])
  })

  it("sorts options by provider name", () => {
    const options = disabledProviderOptions(
      {
        zed: { id: "zed", name: "Zed", env: [], models: {} },
        alpha: { id: "alpha", name: "Alpha", env: [], models: {} },
      },
      [],
    )

    expect(options).toEqual([
      { value: "alpha", label: "Alpha" },
      { value: "zed", label: "Zed" },
    ])
  })
})

describe("providersWithZodeFallback", () => {
  it("adds Zode when backend providers omit it", () => {
    const providers = providersWithZodeFallback({
      anthropic: { id: "anthropic", name: "Anthropic", env: [], models: {} },
    })

    expect(providers.zode?.name).toBe("Zode Gateway")
    expect(providers.anthropic?.name).toBe("Anthropic")
  })

  it("keeps the backend Zode provider when present", () => {
    const providers = providersWithZodeFallback({
      zode: { id: "zode", name: "Custom Zode Name", env: [], models: {} },
    })

    expect(providers.zode?.name).toBe("Custom Zode Name")
  })
})
