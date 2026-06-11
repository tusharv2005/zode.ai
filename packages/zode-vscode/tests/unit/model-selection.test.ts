import { describe, expect, it } from "bun:test"
import { resolveModelSelection } from "../../webview-ui/src/context/model-selection"
import { ZODE_AUTO, parseModelString } from "../../src/shared/provider-model"
import type { Provider } from "../../webview-ui/src/types/messages"

function makeProvider(id: string, name: string, modelIds: string[]): Provider {
  const models: Provider["models"] = {}
  for (const modelID of modelIds) {
    models[modelID] = { id: modelID, name: modelID }
  }
  return { id, name, models }
}

const providers = {
  zode: makeProvider("zode", "Zode Gateway", ["zode-auto/free"]),
  anthropic: makeProvider("anthropic", "Anthropic", ["claude-sonnet-4"]),
  openai: makeProvider("openai", "OpenAI", ["gpt-4.1"]),
}

describe("parseModelString", () => {
  it("parses provider/model pairs", () => {
    expect(parseModelString("anthropic/claude-sonnet-4")).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4",
    })
  })

  it("keeps slashes inside zode model ids", () => {
    expect(parseModelString("zode/zode-auto/free")).toEqual({
      providerID: "zode",
      modelID: "zode-auto/free",
    })
  })

  it("returns null for invalid values", () => {
    expect(parseModelString(undefined)).toBeNull()
    expect(parseModelString("claude-sonnet-4")).toBeNull()
  })
})

describe("resolveModelSelection", () => {
  it("prefers a valid override", () => {
    const result = resolveModelSelection({
      providers,
      connected: ["anthropic", "openai"],
      override: { providerID: "openai", modelID: "gpt-4.1" },
      mode: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual({ providerID: "openai", modelID: "gpt-4.1" })
  })

  it("falls back from an invalid override to the mode model", () => {
    const result = resolveModelSelection({
      providers,
      connected: ["anthropic"],
      override: { providerID: "openai", modelID: "gpt-4.1" },
      mode: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-sonnet-4" })
  })

  it("falls back from invalid config to the first valid recent model", () => {
    const result = resolveModelSelection({
      providers,
      connected: ["openai"],
      mode: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      recent: [
        { providerID: "anthropic", modelID: "claude-sonnet-4" },
        { providerID: "openai", modelID: "gpt-4.1" },
      ],
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual({ providerID: "openai", modelID: "gpt-4.1" })
  })

  it("uses zode auto as the explicit final fallback", () => {
    const result = resolveModelSelection({
      providers,
      connected: [],
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual(ZODE_AUTO)
  })

  it("keeps the explicit fallback even when zode is missing from the loaded catalog", () => {
    const result = resolveModelSelection({
      providers: { openai: providers.openai },
      connected: [],
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual(ZODE_AUTO)
  })

  it("keeps the raw preference order before providers load", () => {
    const result = resolveModelSelection({
      providers: {},
      connected: [],
      override: { providerID: "openai", modelID: "gpt-4.1" },
      mode: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      fallback: ZODE_AUTO,
    })
    expect(result).toEqual({ providerID: "openai", modelID: "gpt-4.1" })
  })
})
