import { NodeHttpServer } from "@effect/platform-node"
import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { HttpClient, HttpClientRequest, HttpRouter } from "effect/unstable/http"
import { HttpApi, HttpApiBuilder } from "effect/unstable/httpapi"
import { Auth } from "../../../src/auth"
import { ZodeGatewayApi, ZodeGatewayPaths } from "../../../src/zodecode/server/httpapi/groups/zode-gateway"
import { zodeGatewayHandlers } from "../../../src/zodecode/server/httpapi/handlers/zode-gateway"
import { InstanceStore } from "../../../src/project/instance-store"
import { ModelCache } from "../../../src/provider/model-cache"
import { Session } from "../../../src/session/session"
import { Authorization } from "../../../src/server/routes/instance/httpapi/middleware/authorization"
import { InstanceContextMiddleware } from "../../../src/server/routes/instance/httpapi/middleware/instance-context"
import {
  WorkspaceRouteContext,
  WorkspaceRoutingMiddleware,
} from "../../../src/server/routes/instance/httpapi/middleware/workspace-routing"
import { testEffect } from "../../lib/effect"

const TestHttpApi = HttpApi.make("opencode-instance").addHttpApi(ZodeGatewayApi)
const auth = Layer.mock(Auth.Service)({
  get: () => Effect.succeed(new Auth.Api({ type: "api", key: "test-token" })),
})
const store = Layer.mock(InstanceStore.Service)({})
const cache = Layer.mock(ModelCache.Service)({})
const session = Layer.mock(Session.Service)({})
const passthroughAuthorization = Layer.succeed(
  Authorization,
  Authorization.of((effect) => effect),
)
const passthroughInstanceContext = Layer.succeed(
  InstanceContextMiddleware,
  InstanceContextMiddleware.of((effect) => effect),
)
const testWorkspaceRouting = Layer.succeed(
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingMiddleware.of((effect) =>
    effect.pipe(Effect.provideService(WorkspaceRouteContext, WorkspaceRouteContext.of({ directory: process.cwd() }))),
  ),
)
const layer = HttpRouter.serve(
  HttpApiBuilder.layer(TestHttpApi).pipe(
    Layer.provide(zodeGatewayHandlers),
    Layer.provide([
      passthroughAuthorization,
      passthroughInstanceContext,
      testWorkspaceRouting,
      auth,
      store,
      cache,
      session,
    ]),
  ),
  { disableListenLog: true, disableLogger: true },
).pipe(Layer.provideMerge(NodeHttpServer.layerTest))
const it = testEffect(layer)

function stub(run: () => Response | Promise<Response>) {
  // These tests run sequentially; scope the process-global override and delegate in-process server traffic.
  const original = globalThis.fetch
  const fetch: typeof globalThis.fetch = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      if (url.startsWith("http://127.0.0.1:")) return original(input, init)
      return run()
    },
    { preconnect: original.preconnect },
  )
  return Effect.acquireRelease(
    Effect.sync(() => {
      globalThis.fetch = fetch
    }),
    () =>
      Effect.sync(() => {
        globalThis.fetch = original
      }),
  )
}

function post(path: string, body: Record<string, unknown>) {
  return HttpClientRequest.post(path).pipe(HttpClientRequest.bodyJson(body), Effect.flatMap(HttpClient.execute))
}

describe("Zode gateway HttpApi statuses", () => {
  it.live("preserves cloud session list rate limits", () =>
    Effect.gen(function* () {
      yield* stub(() => new Response("rate limited", { status: 429 }))

      const response = yield* HttpClient.get(ZodeGatewayPaths.cloudSessions)

      expect(response.status).toBe(429)
      expect(yield* response.json).toEqual({ error: "Cloud sessions fetch failed: 429" })
    }),
  )

  it.live("maps cloud session list transport failures to internal errors", () =>
    Effect.gen(function* () {
      yield* stub(() => Promise.reject(new TypeError("network error")))

      const response = yield* HttpClient.get(ZodeGatewayPaths.cloudSessions)

      expect(response.status).toBe(500)
      expect(yield* response.json).toEqual({ error: "Internal error" })
    }),
  )

  it.live("preserves missing cloud session previews", () =>
    Effect.gen(function* () {
      yield* stub(() => new Response("missing", { status: 404 }))

      const response = yield* HttpClient.get(ZodeGatewayPaths.cloudSession.replace(":id", "missing"))

      expect(response.status).toBe(404)
      expect(yield* response.json).toEqual({ error: "Session not found" })
    }),
  )

  it.live("preserves cloud session preview server failures", () =>
    Effect.gen(function* () {
      yield* stub(() => new Response("failed", { status: 500 }))

      const response = yield* HttpClient.get(ZodeGatewayPaths.cloudSession.replace(":id", "failed"))

      expect(response.status).toBe(500)
      expect(yield* response.json).toEqual({ error: "Failed to fetch session" })
    }),
  )

  it.live("maps cloud session preview transport failures to internal errors", () =>
    Effect.gen(function* () {
      yield* stub(() => Promise.reject(new TypeError("network error")))

      const response = yield* HttpClient.get(ZodeGatewayPaths.cloudSession.replace(":id", "failed"))

      expect(response.status).toBe(500)
      expect(yield* response.json).toEqual({ error: "Internal error" })
    }),
  )

  it.live("preserves cloud session import authentication failures", () =>
    Effect.gen(function* () {
      yield* stub(() => new Response("unauthorized", { status: 401 }))

      const response = yield* post(ZodeGatewayPaths.cloudSessionImport, { sessionId: "unauthorized" })

      expect(response.status).toBe(401)
      expect(yield* response.json).toEqual({ error: "Import failed: 401" })
    }),
  )

  it.live("maps cloud session import transport failures to internal errors", () =>
    Effect.gen(function* () {
      yield* stub(() => Promise.reject(new TypeError("network error")))

      const response = yield* post(ZodeGatewayPaths.cloudSessionImport, { sessionId: "failed" })

      expect(response.status).toBe(500)
      expect(yield* response.json).toEqual({ error: "Internal error" })
    }),
  )

  it.live("preserves ZodeClaw worker failures", () =>
    Effect.gen(function* () {
      yield* stub(() => new Response("worker failed", { status: 500 }))

      const response = yield* HttpClient.get(ZodeGatewayPaths.clawStatus)

      expect(response.status).toBe(500)
      expect(yield* response.json).toEqual({ error: "ZodeClaw request failed: 500 worker failed" })
    }),
  )

  it.live("maps ZodeClaw transport failures to bad gateway", () =>
    Effect.gen(function* () {
      yield* stub(() => Promise.reject(new TypeError("network error")))

      const response = yield* HttpClient.get(ZodeGatewayPaths.clawStatus)

      expect(response.status).toBe(502)
      expect(yield* response.json).toEqual({ error: "Failed to reach ZodeClaw" })
    }),
  )
})
