import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { Flag } from "@opencode-ai/core/flag/flag"
import * as Log from "@opencode-ai/core/util/log"
import { Server } from "../../../src/server/server"
import { resetDatabase } from "../../fixture/db"
import { disposeAllInstances, tmpdir } from "../../fixture/fixture"

void Log.init({ print: false })

type Source = {
  order: number
  kind: string
  scope: string
  label: string
  source: string
  path?: string
  exists: boolean
  editable: boolean
  reason?: string
}

type Body = {
  sources: Source[]
}

const env = {
  ZODE_CONFIG: process.env.ZODE_CONFIG,
  ZODE_CONFIG_CONTENT: process.env.ZODE_CONFIG_CONTENT,
  ZODE_CONFIG_DIR: process.env.ZODE_CONFIG_DIR,
  ZODE_DISABLE_PROJECT_CONFIG: process.env.ZODE_DISABLE_PROJECT_CONFIG,
  ZODE_TEST_MANAGED_CONFIG_DIR: process.env.ZODE_TEST_MANAGED_CONFIG_DIR,
  flagConfig: Flag.ZODE_CONFIG,
}

afterEach(async () => {
  restore()
  await disposeAllInstances()
  await resetDatabase()
})

function restore() {
  set("ZODE_CONFIG", env.ZODE_CONFIG)
  set("ZODE_CONFIG_CONTENT", env.ZODE_CONFIG_CONTENT)
  set("ZODE_CONFIG_DIR", env.ZODE_CONFIG_DIR)
  set("ZODE_DISABLE_PROJECT_CONFIG", env.ZODE_DISABLE_PROJECT_CONFIG)
  set("ZODE_TEST_MANAGED_CONFIG_DIR", env.ZODE_TEST_MANAGED_CONFIG_DIR)
  Flag.ZODE_CONFIG = env.flagConfig
}

function set(key: keyof typeof process.env, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

async function sources(dir: string) {
  const response = await Server.Default().app.request("/config/sources", {
    headers: { "x-zode-directory": dir },
  })
  expect(response.status).toBe(200)
  return (await response.json()) as Body
}

function order(body: Body, file: string) {
  const hit = body.sources.find((source) => source.path === file)
  expect(hit).toBeDefined()
  return hit!.order
}

describe("config source routes", () => {
  test("lists source metadata in load order without config contents", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "env.json"), "{}")
        await Bun.write(path.join(dir, "zode.json"), "{}")

        const local = path.join(dir, ".zode")
        await fs.mkdir(local, { recursive: true })
        await Bun.write(path.join(local, "zode.jsonc"), "{}")

        const extra = path.join(dir, "extra")
        await fs.mkdir(extra, { recursive: true })
        await Bun.write(path.join(extra, "opencode.json"), "{}")

        const managed = path.join(dir, "managed")
        await fs.mkdir(managed, { recursive: true })
        await Bun.write(path.join(managed, "zode.json"), "{}")
      },
    })

    const envFile = path.join(tmp.path, "env.json")
    const projectFile = path.join(tmp.path, "zode.json")
    const configFile = path.join(tmp.path, ".zode", "zode.jsonc")
    const extraFile = path.join(tmp.path, "extra", "opencode.json")
    const managedFile = path.join(tmp.path, "managed", "zode.json")

    process.env.ZODE_CONFIG = envFile
    Flag.ZODE_CONFIG = envFile
    process.env.ZODE_CONFIG_CONTENT = '{"username":"secret-inline-value"}'
    process.env.ZODE_CONFIG_DIR = path.join(tmp.path, "extra")
    process.env.ZODE_TEST_MANAGED_CONFIG_DIR = path.join(tmp.path, "managed")

    const body = await sources(tmp.path)
    const inline = body.sources.find((source) => source.source === "ZODE_CONFIG_CONTENT")

    expect(order(body, envFile)).toBeLessThan(order(body, projectFile))
    expect(order(body, projectFile)).toBeLessThan(order(body, configFile))
    expect(order(body, configFile)).toBeLessThan(order(body, extraFile))
    expect(inline?.order).toBeGreaterThan(order(body, extraFile))
    expect(inline?.order).toBeLessThan(order(body, managedFile))

    expect(body.sources.find((source) => source.path === configFile)).toMatchObject({
      kind: "config-dir-file",
      scope: "project",
      exists: true,
      editable: true,
    })
    expect(body.sources.find((source) => source.path === managedFile)).toMatchObject({
      kind: "managed-file",
      scope: "managed",
      exists: true,
      editable: false,
    })
    expect(JSON.stringify(body)).not.toContain("secret-inline-value")
  })

  test("shows project config disabled by environment", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "zode.json"), "{}")
        await fs.mkdir(path.join(dir, ".zode"), { recursive: true })
        await Bun.write(path.join(dir, ".zode", "zode.json"), "{}")
      },
    })

    process.env.ZODE_DISABLE_PROJECT_CONFIG = "1"

    const body = await sources(tmp.path)

    expect(body.sources.some((source) => source.path === path.join(tmp.path, "zode.json"))).toBe(false)
    expect(body.sources.some((source) => source.path === path.join(tmp.path, ".zode", "zode.json"))).toBe(false)
    expect(body.sources.find((source) => source.source === "ZODE_DISABLE_PROJECT_CONFIG")).toMatchObject({
      kind: "runtime-env",
      scope: "env",
      exists: true,
      editable: false,
    })
  })
})
