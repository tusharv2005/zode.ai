import { describe, expect, test } from "bun:test"
import { hasAtomicChatPlugin } from "@/zodecode/atomic-chat-feature"
import { ZodecodeDefaultPlugins } from "@/zodecode/config/default-plugins"

describe("zodecode default atomic chat plugin", () => {
  test("apply adds atomic chat plugin when default plugins are enabled", () => {
    const cfg = { plugin: [] as string[] }
    ZodecodeDefaultPlugins.apply(cfg, { disabled: false })
    expect(hasAtomicChatPlugin(cfg.plugin ?? [])).toBe(true)
  })

  test("apply does not add atomic chat plugin when default plugins are disabled", () => {
    const cfg = { plugin: ["global-plugin-1"] as string[] }
    ZodecodeDefaultPlugins.apply(cfg, { disabled: true })
    expect(hasAtomicChatPlugin(cfg.plugin ?? [])).toBe(false)
    expect(cfg.plugin).toEqual(["global-plugin-1"])
  })

  test("apply does not duplicate atomic chat plugin", () => {
    const cfg = { plugin: ["@zodecode/plugin-atomic-chat"] as string[] }
    ZodecodeDefaultPlugins.apply(cfg, { disabled: false })
    expect(cfg.plugin?.filter((p) => hasAtomicChatPlugin([p])).length).toBe(1)
  })
})
