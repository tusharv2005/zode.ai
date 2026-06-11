import { Cause, Context, Effect, Layer } from "effect"
import { EffectBridge } from "@/effect/bridge"
import { ZodeSessions } from "@/zode-sessions/zode-sessions"
import * as Log from "@opencode-ai/core/util/log"
import { Global } from "@opencode-ai/core/global"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import path from "node:path"
import { Bus } from "@/bus"
import { SessionExport } from "@/zodecode/session-export"
import { createWorkspaceProvider } from "@/zodecode/session-export/workspace-provider"
import { Instance } from "@/project/instance"
import { Identity } from "@zodecode/zode-telemetry"

const log = Log.create({ service: "zodecode-bootstrap" })

export namespace ZodecodeBootstrap {
  export interface Interface {
    readonly init: () => Effect.Effect<void, unknown>
  }

  export class Service extends Context.Service<Service, Interface>()("@zodecode/Bootstrap") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const sessions = yield* ZodeSessions.Service

      const init = Effect.fn("ZodecodeBootstrap.init")(function* () {
        yield* sessions.init()
        // zodecode_change start - session export bootstrap
        yield* Effect.gen(function* () {
          if (!SessionExport.enabled) return
          const anon = yield* EffectBridge.fromPromise(() =>
            Identity.getMachineId().catch((err) => {
              log.warn("session export identity failed", { err })
              return undefined
            }),
          )
          SessionExport.init({
            agentVersion: InstallationVersion,
            anonId: anon,
            dbPath: path.join(Global.Path.data, "session-export.db"),
            workspaceKey: Instance.directory,
            subscribeAll: (cb) => Bus.subscribeAll(cb),
            snapshotProvider: createWorkspaceProvider({
              root: Instance.directory,
              statePath: path.join(Global.Path.data, "session-export-workspace.json"),
            }),
          })
        }).pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => log.warn("session export bootstrap failed", { err: Cause.squash(cause) })),
          ),
        )
        // zodecode_change end
        yield* EffectBridge.fromPromise(() =>
          import("@/zodecode/indexing").then((mod) => mod.ZodeIndexing.init()),
        ).pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => log.warn("indexing bootstrap failed", { err: Cause.squash(cause) })),
          ),
          Effect.forkDetach,
        )
      })

      return Service.of({ init })
    }),
  )

  export const defaultLayer = layer.pipe(Layer.provide(ZodeSessions.defaultLayer))
}
