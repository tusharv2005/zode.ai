import { describe, expect, test } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { hasIndexingPlugin, isIndexingPlugin, normalizePluginName } from "../../../src/detect"

describe("indexing plugin detection", () => {
  test("bundles detect module for browser targets", async () => {
    const dir = await mkdtemp(`${tmpdir()}/zode-indexing-detect-`)
    const result = await Bun.build({
      entrypoints: [new URL("../../../src/detect.ts", import.meta.url).pathname],
      minify: true,
      outdir: dir,
      target: "browser",
    })

    expect(result.success).toBe(true)
  })

  test("normalizes supported plugin forms", () => {
    expect(normalizePluginName("zode-indexing")).toBe("zode-indexing")
    expect(normalizePluginName("zode-indexing@1.2.3")).toBe("zode-indexing")
    expect(normalizePluginName("@zodecode/zode-indexing")).toBe("@zodecode/zode-indexing")
    expect(normalizePluginName("@zodecode/zode-indexing@1.2.3")).toBe("@zodecode/zode-indexing")
    expect(normalizePluginName("../../packages/zode-indexing")).toBe("@zodecode/zode-indexing")
    expect(normalizePluginName("file:///tmp/.opencode/plugin/zode-indexing.js")).toBe("zode-indexing")
    expect(normalizePluginName("file:///tmp/node_modules/@zodecode/zode-indexing/index.js")).toBe(
      "@zodecode/zode-indexing",
    )
    expect(normalizePluginName("file:///tmp/repo/packages/zode-indexing/src/index.ts")).toBe("@zodecode/zode-indexing")
  })

  test("detects supported indexing plugin specifiers", () => {
    const values = [
      "zode-indexing",
      "zode-indexing@1.2.3",
      "@zodecode/zode-indexing",
      "@zodecode/zode-indexing@1.2.3",
      "../../packages/zode-indexing",
      "file:///tmp/.opencode/plugin/zode-indexing.js",
      "file:///tmp/node_modules/@zodecode/zode-indexing/index.js",
      "file:///tmp/repo/packages/zode-indexing/src/index.ts",
    ]

    for (const value of values) {
      expect(isIndexingPlugin(value)).toBe(true)
    }
  })

  test("ignores unrelated plugin specifiers", () => {
    expect(isIndexingPlugin("@zodecode/zode-gateway")).toBe(false)
    expect(isIndexingPlugin("file:///tmp/.opencode/plugin/index.js")).toBe(false)
    expect(hasIndexingPlugin(["@zodecode/zode-gateway", "foo@1.0.0"])).toBe(false)
  })

  test("detects indexing plugin in merged plugin lists", () => {
    expect(
      hasIndexingPlugin(["@zodecode/zode-gateway", "file:///tmp/node_modules/@zodecode/zode-indexing/index.js"]),
    ).toBe(true)
  })
})
