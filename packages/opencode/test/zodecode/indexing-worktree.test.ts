import { afterEach, describe, expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import type { Config } from "../../src/config/config"
import { ZodeIndexing } from "../../src/zodecode/indexing"
import { WithInstance } from "../../src/project/with-instance"
import { disposeAllInstances, tmpdir } from "../fixture/fixture"

const cfg: Partial<Config.Info> = {
  plugin: ["@zodecode/zode-indexing"],
  indexing: {
    enabled: true,
    provider: "ollama",
    vectorStore: "qdrant",
    ollama: {
      baseUrl: "http://127.0.0.1:1",
    },
  },
}

const configDir = process.env["ZODE_CONFIG_DIR"]

afterEach(async () => {
  if (configDir === undefined) delete process.env["ZODE_CONFIG_DIR"]
  else process.env["ZODE_CONFIG_DIR"] = configDir
  await disposeAllInstances()
})

describe("indexing worktree disable", () => {
  test("returns disabled status in .zode/worktrees paths", async () => {
    await using tmp = await tmpdir({ git: true, config: cfg })
    process.env["ZODE_CONFIG_DIR"] = tmp.path
    const dir = `${tmp.path}/.zode/worktrees/feature`
    await mkdir(dir, { recursive: true })

    await WithInstance.provide({
      directory: dir,
      fn: async () => {
        const status = await ZodeIndexing.current()

        expect(status.state).toBe("Disabled")
        expect(status.message).toBe("Indexing is disabled in worktree sessions. Use the main workspace for indexing.")
        expect(await ZodeIndexing.available()).toBe(false)
        expect(ZodeIndexing.ready()).toBe(false)
        expect(await ZodeIndexing.search("worktree")).toEqual([])
      },
    })
  })

  test("returns disabled status in legacy .zodecode/worktrees paths", async () => {
    await using tmp = await tmpdir({ git: true, config: cfg })
    process.env["ZODE_CONFIG_DIR"] = tmp.path
    const dir = `${tmp.path}/.zodecode/worktrees/feature`
    await mkdir(dir, { recursive: true })

    await WithInstance.provide({
      directory: dir,
      fn: async () => {
        const status = await ZodeIndexing.current()

        expect(status.state).toBe("Disabled")
        expect(status.message).toBe("Indexing is disabled in worktree sessions. Use the main workspace for indexing.")
        expect(await ZodeIndexing.available()).toBe(false)
        expect(ZodeIndexing.ready()).toBe(false)
      },
    })
  })
})
