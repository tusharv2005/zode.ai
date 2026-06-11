import { describe, expect, test } from "bun:test"
import path from "path"

const root = path.join(__dirname, "..", "..")

describe("Zode OAuth branding", () => {
  test("Codex OAuth browser flow uses Zode branding", async () => {
    const src = await Bun.file(path.join(root, "src", "plugin", "codex.ts")).text()

    expect(src).toContain('originator: "zode"')
    expect(src).toContain("return to Zode")
    expect(src).not.toContain('originator: "opencode"')
    expect(src).not.toContain("return to OpenCode")
  })

  test("MCP OAuth callback page uses Zode branding", async () => {
    const src = await Bun.file(path.join(root, "src", "mcp", "oauth-callback.ts")).text()

    expect(src).toContain("return to Zode")
    expect(src).not.toContain("return to OpenCode")
  })
})
