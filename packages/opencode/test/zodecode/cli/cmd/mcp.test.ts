import { describe, expect, test } from "bun:test"
import { ZodecodeMcpConfig } from "@/zodecode/cli/cmd/mcp"

const added = `{
  "permission": {
    "bash": "allow"
  },
  "mcp": {
    "linear": {
      "type": "remote",
      "url": "https://mcp.linear.app/mcp",
      "oauth": {}
    }
  },
}`

describe("ZodecodeMcpConfig.format", () => {
  test("writes strict JSON for zode.json", () => {
    const output = ZodecodeMcpConfig.format("/tmp/zode.json", added)

    expect(JSON.parse(output)).toEqual({
      permission: { bash: "allow" },
      mcp: {
        linear: {
          type: "remote",
          url: "https://mcp.linear.app/mcp",
          oauth: {},
        },
      },
    })
    expect(output).not.toEndWith(",\n}")
  })

  test("preserves JSONC formatting for zode.jsonc", () => {
    expect(ZodecodeMcpConfig.format("/tmp/zode.jsonc", added)).toBe(added)
  })
})
