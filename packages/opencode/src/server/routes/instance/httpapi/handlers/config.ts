import { Config } from "@/config/config"
// zodecode_change start - preserve Zode API default model overlay
import { fetchDefaultModel } from "@zodecode/zode-gateway"
import { Auth } from "@/auth"
import { ModelID, ProviderID } from "@/provider/schema"
// zodecode_change end
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi" // zodecode_change
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

export const configHandlers = HttpApiBuilder.group(InstanceHttpApi, "config", (handlers) =>
  Effect.gen(function* () {
    const providerSvc = yield* Provider.Service
    const configSvc = yield* Config.Service

    const get = Effect.fn("ConfigHttpApi.get")(function* () {
      return yield* configSvc.get()
    })

    const update = Effect.fn("ConfigHttpApi.update")(function* (ctx) {
      yield* configSvc.update(ctx.payload)
      yield* markInstanceForDisposal(yield* InstanceState.context)
      return ctx.payload
    })

    // zodecode_change start
    const warnings = Effect.fn("ConfigHttpApi.warnings")(function* () {
      return yield* configSvc.warnings()
    })
    // zodecode_change end

    const providers = Effect.fn("ConfigHttpApi.providers")(function* () {
      const providers = yield* providerSvc.list()
      const defaults = Provider.defaultModelIDs(providers)

      // zodecode_change start - Fetch default model from Zode API when the zode provider is available.
      if (providers[ProviderID.zode]) {
        const auth = yield* Auth.Service
        const info = yield* auth.get("zode").pipe(Effect.mapError(() => new HttpApiError.Unauthorized({}))) // zodecode_change
        const token = info?.type === "oauth" ? info.access : info?.key
        const organizationId = info?.type === "oauth" ? info.accountId : undefined
        const model = yield* Effect.promise(() => fetchDefaultModel(token, organizationId))
        if (model && providers[ProviderID.zode]?.models[model]) defaults[ProviderID.zode] = ModelID.make(model)
      }
      // zodecode_change end

      return {
        providers: Object.values(providers).map(Provider.toPublicInfo),
        default: defaults,
      }
    })

    return handlers
      .handle("get", get)
      .handle("update", update)
      .handle("warnings", warnings)
      .handle("providers", providers) // zodecode_change
  }),
)
