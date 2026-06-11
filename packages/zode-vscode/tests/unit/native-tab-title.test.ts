import { describe, expect, it } from "bun:test"
import type { Session } from "@zodecode/sdk/v2/client"
import { nativeTitle } from "../../src/zode-provider/native-tab-title"

const session = (title: string | null) => ({ title }) as Session

describe("nativeTitle", () => {
  it("uses the default title without a useful session title", () => {
    expect(nativeTitle(null)).toBe("Zode Code")
    expect(nativeTitle(session(""))).toBe("Zode Code")
    expect(nativeTitle(session("New session - 2026-05-06T10:39:00.000Z"))).toBe("Zode Code")
  })

  it("keeps short session titles", () => {
    expect(nativeTitle(session("Greeting"))).toBe("Greeting")
  })

  it("truncates long session titles", () => {
    expect(nativeTitle(session("Dynamic VS Code tab titles for Zode sessions"))).toBe("Dynamic VS Code tab...")
  })
})
