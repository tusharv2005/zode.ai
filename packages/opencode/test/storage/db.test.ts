import { describe, expect, test } from "bun:test"
import path from "path"
import { Flag } from "@opencode-ai/core/flag/flag" // zodecode_change
import { Global } from "@opencode-ai/core/global"
import { InstallationChannel } from "@opencode-ai/core/installation/version"
import { Database } from "@/storage/db"

describe("Database.Path", () => {
  test("returns database path for the current channel", () => {
    // zodecode_change start — test preload sets ZODE_DB=:memory:
    if (Flag.ZODE_DB) {
      const expected =
        Flag.ZODE_DB === ":memory:" || path.isAbsolute(Flag.ZODE_DB)
          ? Flag.ZODE_DB
          : path.join(Global.Path.data, Flag.ZODE_DB)
      expect(Database.Path).toBe(expected)
      return
    }
    // zodecode_change end
    const expected = ["latest", "beta"].includes(InstallationChannel)
      ? path.join(Global.Path.data, "zode.db")
      : path.join(Global.Path.data, `opencode-${InstallationChannel.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
    expect(Database.getChannelPath()).toBe(expected)
  })
})
