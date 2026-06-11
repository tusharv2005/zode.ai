import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import * as ZodeAgent from "@/zodecode/agent"
import { EffectBridge } from "@/effect/bridge"
import { HeapSnapshot } from "@/zodecode/cli/heap-snapshot"
import { InstanceHttpApi } from "@/server/routes/instance/httpapi/api"
import { Skill } from "@/skill"
import { RemoveAgentPayload, RemoveSkillPayload } from "../groups/zodecode"

export const zodecodeHandlers = HttpApiBuilder.group(InstanceHttpApi, "zodecode", (handlers) =>
  Effect.gen(function* () {
    const heapSnapshot = Effect.fn("ZodecodeHttpApi.heapSnapshot")(function* () {
      return yield* Effect.sync(() => HeapSnapshot.write())
    })

    const removeSkill = Effect.fn("ZodecodeHttpApi.removeSkill")(function* (ctx: {
      payload: typeof RemoveSkillPayload.Type
    }) {
      yield* Effect.promise(() => Skill.remove(ctx.payload.location))
      return true
    })

    const removeAgent = Effect.fn("ZodecodeHttpApi.removeAgent")(function* (ctx: {
      payload: typeof RemoveAgentPayload.Type
    }) {
      yield* EffectBridge.fromPromise(() => ZodeAgent.remove(ctx.payload.name))
      return true
    })

    return handlers
      .handle("heapSnapshot", heapSnapshot)
      .handle("removeSkill", removeSkill)
      .handle("removeAgent", removeAgent)
  }),
)
