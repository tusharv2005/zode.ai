import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { Effect, Layer, Schema } from "effect"
import * as Log from "@opencode-ai/core/util/log"
import { Agent } from "../../src/agent/agent"
import { ZodeIndexing } from "../../src/zodecode/indexing"
import { ZodecodeBootstrap } from "../../src/zodecode/bootstrap"
import { ZodeSessions } from "../../src/zode-sessions/zode-sessions"
import { ZodeToolRegistry } from "../../src/zodecode/tool/registry"
import { ModelID, ProviderID } from "../../src/provider/schema"
import { ToolRegistry } from "../../src/tool/registry"
import type * as Tool from "../../src/tool/tool"
import { Instance } from "../../src/project/instance"
import { disposeAllInstances, provideTmpdirInstance } from "../fixture/fixture"
import * as CrossSpawnSpawner from "@opencode-ai/core/cross-spawn-spawner"
import { testEffect } from "../lib/effect"

const node = CrossSpawnSpawner.defaultLayer
const it = testEffect(Layer.mergeAll(Agent.defaultLayer, ToolRegistry.defaultLayer, node))
const ref = {
  providerID: ProviderID.make("test"),
  modelID: ModelID.make("test-model"),
}

afterEach(async () => {
  await disposeAllInstances()
})

describe("zodecode tool registry indexing", () => {
  const logger = Log.create({ service: "zodecode-tool-registry" })

  it.live("omits semantic_search without waiting for slow indexing startup", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const avail = spyOn(ZodeIndexing, "available").mockImplementation(() => new Promise<boolean>(() => {}))

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).not.toContain("semantic_search")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(avail).not.toHaveBeenCalled()
          } finally {
            avail.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("keeps non-indexing tools when indexing readiness throws", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const err = new Error("ready failed")
          const ready = spyOn(ZodeIndexing, "ready").mockImplementation(() => {
            throw err
          })
          const warn = spyOn(logger, "warn").mockImplementation(() => {})

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).not.toContain("semantic_search")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(warn.mock.calls[0]?.[0]).toBe("semantic search unavailable")
            expect(warn.mock.calls[0]?.[1]?.err).toBeDefined()
          } finally {
            ready.mockRestore()
            warn.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("keeps non-indexing tools when indexing readiness rejects", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const err = new Error("ready rejected")
          const ready = spyOn(ZodeIndexing, "ready").mockImplementation(() => Promise.reject(err) as unknown as boolean)
          const warn = spyOn(logger, "warn").mockImplementation(() => {})

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).not.toContain("semantic_search")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(warn.mock.calls[0]?.[0]).toBe("semantic search unavailable")
            expect(warn.mock.calls[0]?.[1]?.err).toBeDefined()
          } finally {
            ready.mockRestore()
            warn.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("registers semantic_search when indexing is ready", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(ZodeIndexing, "ready").mockReturnValue(true)

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("omits semantic_search hint from glob and grep descriptions when indexing is not ready", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(ZodeIndexing, "ready").mockReturnValue(false)

          try {
            const agent = yield* Agent.Service
            const build = yield* agent.get("build")
            const registry = yield* ToolRegistry.Service
            const tools = yield* registry.tools({ ...ref, agent: build })
            const glob = tools.find((tool) => tool.id === "glob")?.description ?? ""
            const grep = tools.find((tool) => tool.id === "grep")?.description ?? ""

            expect(glob).not.toContain("semantic_search")
            expect(grep).not.toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("includes semantic_search hint in glob and grep descriptions when indexing is ready", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(ZodeIndexing, "ready").mockReturnValue(true)

          try {
            const agent = yield* Agent.Service
            const build = yield* agent.get("build")
            const registry = yield* ToolRegistry.Service
            const tools = yield* registry.tools({ ...ref, agent: build })
            const ids = tools.map((tool) => tool.id)
            const glob = tools.find((tool) => tool.id === "glob")?.description ?? ""
            const grep = tools.find((tool) => tool.id === "grep")?.description ?? ""

            expect(ids).toContain("semantic_search")
            expect(glob).toContain("semantic_search")
            expect(grep).toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  test("conditionally includes Zode registry extras", () => {
    const prev = process.env["ZODE_CLIENT"]
    const def = (id: string): Tool.Def => ({
      id,
      description: id,
      parameters: Schema.String,
      execute: () => Effect.succeed({ title: id, output: id, metadata: {} }),
    })
    const tools = {
      codebase: def("codebase_search"),
      semantic: def("semantic_search"),
      recall: def("recall"),
      manager: def("agent_manager"),
      process: def("background_process"),
    }

    try {
      process.env["ZODE_CLIENT"] = "cli"
      expect(ZodeToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual([
        "semantic_search",
        "recall",
        "background_process",
      ])
      expect(ZodeToolRegistry.extra(tools, { experimental: { codebase_search: true } }).map((tool) => tool.id)).toEqual(
        ["codebase_search", "semantic_search", "recall", "background_process"],
      )

      process.env["ZODE_CLIENT"] = "vscode"
      expect(ZodeToolRegistry.extra(tools, { experimental: { codebase_search: true } }).map((tool) => tool.id)).toEqual(
        ["codebase_search", "semantic_search", "recall", "background_process", "agent_manager"],
      )
      expect(ZodeToolRegistry.extra({ ...tools, semantic: undefined }, {}).map((tool) => tool.id)).toEqual([
        "recall",
        "background_process",
        "agent_manager",
      ])

      process.env["ZODE_CLIENT"] = "desktop"
      expect(ZodeToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual(["semantic_search", "recall"])
    } finally {
      if (prev === undefined) delete process.env["ZODE_CLIENT"]
      if (prev !== undefined) process.env["ZODE_CLIENT"] = prev
    }
  })

  test("logs indexing bootstrap failures without blocking session bootstrap", async () => {
    const logger = Log.create({ service: "zodecode-bootstrap" })
    const err = new Error("indexing init failed")
    const calls: string[] = []
    const sessions = Layer.succeed(
      ZodeSessions.Service,
      ZodeSessions.Service.of({ init: () => Effect.sync(() => calls.push("sessions")) }),
    )
    const indexing = spyOn(ZodeIndexing, "init").mockRejectedValue(err)
    const warn = spyOn(logger, "warn").mockImplementation(() => {})

    try {
      await Effect.runPromise(
        ZodecodeBootstrap.Service.use((svc) => svc.init()).pipe(
          Effect.provide(ZodecodeBootstrap.layer.pipe(Layer.provide(sessions))),
          Effect.scoped,
        ),
      )
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(calls).toEqual(["sessions"])
      expect(indexing).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith("indexing bootstrap failed", { err })
    } finally {
      indexing.mockRestore()
      warn.mockRestore()
    }
  })
})
