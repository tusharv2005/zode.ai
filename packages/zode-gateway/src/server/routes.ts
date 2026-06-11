/**
 * Zode Gateway specific routes
 * Handles profile fetching and organization management for Zode Gateway provider
 *
 * This factory function accepts OpenCode dependencies to create Zode-specific routes
 */

import { fetchZodecodeNotifications, ZodecodeNotificationSchema } from "../api/notifications.js"
import { fetchOrganizationModes, clearModesCache } from "../api/modes.js"
import { ZODE_API_BASE, HEADER_FEATURE, HEADER_ORGANIZATIONID } from "../api/constants.js"
import { buildZodeHeaders } from "../headers.js"
import type { ImportDeps, DrizzleDb } from "../cloud-sessions.js"
import { fetchCloudSession, fetchCloudSessionForImport, importSessionToDb } from "../cloud-sessions.js"
import { createEditHandler } from "./edit.js"
import { createFimHandler } from "./fim.js"
import {
  GatewayError,
  UnauthorizedError,
  getClawChatCredentials,
  getClawStatus,
  getCloudSessions,
  getNotifications,
  getProfile,
  setOrganization,
} from "./handlers.js"

// Type definitions for OpenCode dependencies (injected at runtime)
type Hono = any
type DescribeRoute = any
type Validator = any
type Resolver = any
type Errors = any
type Auth = any
type ModelCache = { clear: (providerID: string) => void | Promise<void> }
type Z = any

interface ZodeRoutesDeps extends ImportDeps {
  Hono: new () => Hono
  describeRoute: DescribeRoute
  validator: Validator
  resolver: Resolver
  errors: Errors
  Auth: Auth
  ModelCache: ModelCache
  z: Z
  Instances: { disposeAllInstances(): Promise<void> }
}

/**
 * Create Zode Gateway routes with OpenCode dependencies injected
 *
 * @example
 * ```typescript
 * import { createZodeRoutes } from "@zodecode/zode-gateway"
 * import { Hono } from "hono"
 * import { describeRoute, validator, resolver } from "hono-openapi"
 * import z from "zod"
 * import { errors } from "../error"
 * import { Auth } from "../../auth"
 *
 * export const ZodeRoutes = createZodeRoutes({
 *   Hono,
 *   describeRoute,
 *   validator,
 *   resolver,
 *   errors,
 *   Auth,
 *   z,
 * })
 * ```
 */
export function createZodeRoutes(deps: ZodeRoutesDeps) {
  const {
    Hono,
    describeRoute,
    validator,
    resolver,
    errors,
    Auth,
    z,
    Database,
    Instance,
    SessionTable,
    MessageTable,
    PartTable,
    SessionToRow,
    Bus,
    SessionCreatedEvent,
    Identifier,
    ModelCache,
    Instances,
  } = deps

  const Organization = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  })

  const Profile = z.object({
    email: z.string(),
    name: z.string().optional(),
    organizations: z.array(Organization).optional(),
  })

  const Balance = z.object({
    balance: z.number(),
  })

  const ProfileWithBalance = z.object({
    profile: Profile,
    balance: Balance.nullable(),
    currentOrgId: z.string().nullable(),
  })

  const EditCompletionResponse = z.object({
    content: z.string(),
    usage: z
      .object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
      })
      .optional(),
  })

  const FimStreamChunk = z.object({
    choices: z
      .array(
        z.object({
          delta: z
            .object({
              content: z.string().optional(),
            })
            .optional(),
          text: z.string().optional(), // Text-completion style streaming (Mercury)
        }),
      )
      .optional(),
    usage: z
      .object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
      })
      .optional(),
    cost: z.number().optional(),
  })

  const TranscriptionResponse = z.object({
    text: z.string(),
    usage: z.unknown().optional(),
  })

  const getProxyAuth = async () => {
    const auth = await Auth.get("zode")
    const token = auth?.type === "api" ? auth.key : auth?.type === "oauth" ? auth.access : undefined
    return {
      auth,
      token,
      organizationId: auth?.type === "oauth" ? auth.accountId : undefined,
    }
  }

  return new Hono()
    .get(
      "/profile",
      describeRoute({
        summary: "Get Zode Gateway profile",
        description: "Fetch user profile and organizations from Zode Gateway",
        operationId: "zode.profile",
        responses: {
          200: {
            description: "Profile data",
            content: {
              "application/json": {
                schema: resolver(ProfileWithBalance),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      async (c: any) => {
        try {
          return c.json(await getProfile(Auth))
        } catch (err) {
          if (!(err instanceof UnauthorizedError)) throw err
          return c.json({ error: "Not authenticated with Zode Gateway" }, 401)
        }
      },
    )
    .post(
      "/organization",
      describeRoute({
        summary: "Update Zode Gateway organization",
        description: "Switch to a different Zode Gateway organization",
        operationId: "zode.organization.set",
        responses: {
          200: {
            description: "Organization updated successfully",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      validator(
        "json",
        z.object({
          organizationId: z.string().nullable(),
        }),
      ),
      async (c: any) => {
        const { organizationId } = c.req.valid("json")

        try {
          return c.json(
            await setOrganization(
              {
                auth: Auth,
                clear: () => ModelCache.clear("zode"),
                dispose: () => Instances.disposeAllInstances(),
              },
              organizationId,
            ),
          )
        } catch (err) {
          if (!(err instanceof UnauthorizedError)) throw err
          return c.json({ error: "Not authenticated with Zode Gateway" }, 401)
        }
      },
    )
    .get(
      "/modes",
      describeRoute({
        summary: "Get organization custom modes",
        description: "Fetch custom modes defined for the current organization",
        operationId: "zode.modes",
        responses: {
          200: {
            description: "Organization modes list",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    modes: z.array(
                      z.object({
                        id: z.string(),
                        organization_id: z.string(),
                        name: z.string(),
                        slug: z.string(),
                        created_by: z.string(),
                        created_at: z.string(),
                        updated_at: z.string(),
                        config: z.object({
                          roleDefinition: z.string().optional(),
                          whenToUse: z.string().optional(),
                          description: z.string().optional(),
                          customInstructions: z.string().optional(),
                          groups: z
                            .array(
                              z.union([
                                z.string(),
                                z.tuple([
                                  z.string(),
                                  z.object({ fileRegex: z.string().optional(), description: z.string().optional() }),
                                ]),
                              ]),
                            )
                            .optional(),
                        }),
                      }),
                    ),
                  }),
                ),
              },
            },
          },
        },
      }),
      async (c: any) => {
        const auth = await Auth.get("zode")

        if (!auth || auth.type !== "oauth") {
          return c.json({ modes: [] })
        }

        const token = auth.access
        if (!token) {
          return c.json({ modes: [] })
        }

        const orgId = auth.accountId
        if (!orgId) {
          return c.json({ modes: [] })
        }

        try {
          const modes = await fetchOrganizationModes(token, orgId)
          return c.json({ modes })
        } catch {
          return c.json({ modes: [] })
        }
      },
    )
    .post(
      "/fim",
      describeRoute({
        summary: "FIM completion",
        description: "Proxy a Fill-in-the-Middle completion request to the Zode Gateway",
        operationId: "zode.fim",
        responses: {
          200: {
            description: "Streaming FIM completion response",
            content: {
              "text/event-stream": {
                schema: resolver(FimStreamChunk),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      validator(
        "json",
        z.object({
          prefix: z.string(),
          suffix: z.string(),
          provider: z.string().optional(),
          model: z.string().optional(),
          maxTokens: z.number().optional(),
          temperature: z.number().optional(),
        }),
      ),
      createFimHandler(Auth),
    )
    .post(
      "/edit",
      describeRoute({
        summary: "Next Edit completion",
        description:
          "Proxy a Mercury-style Next Edit request. The client supplies structured editor " +
          "context; the gateway assembles the sentinel-tagged prompt and forwards to the upstream edit endpoint.",
        operationId: "zode.edit",
        responses: {
          200: {
            description: "Next Edit completion",
            content: {
              "application/json": {
                schema: resolver(EditCompletionResponse),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      validator(
        "json",
        z.object({
          provider: z.string().optional(),
          model: z.string().optional(),
          maxTokens: z.number().optional(),
          currentFilePath: z.string(),
          currentFileContent: z.string(),
          cursorLine: z.number(),
          cursorCharacter: z.number(),
          editableRegionStartLine: z.number(),
          editableRegionEndLine: z.number(),
          recentlyViewedSnippets: z.array(z.object({ filepath: z.string(), content: z.string() })),
          editDiffHistory: z.array(z.string()),
        }),
      ),
      createEditHandler(Auth),
    )
    .post(
      "/audio/transcriptions",
      describeRoute({
        summary: "Speech to text transcription",
        description: "Proxy an audio transcription request to the Zode Gateway",
        operationId: "zode.audio.transcriptions",
        responses: {
          200: {
            description: "Transcription response",
            content: {
              "application/json": {
                schema: resolver(TranscriptionResponse),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      validator(
        "json",
        z.object({
          model: z.string(),
          input_audio: z.object({
            data: z.string(),
            format: z.string(),
          }),
          language: z.string().optional(),
          prompt: z.string().optional(),
          temperature: z.number().optional(),
        }),
      ),
      async (c: any) => {
        const proxy = await getProxyAuth()
        if (!proxy.auth) return c.json({ error: "Not authenticated with Zode Gateway" }, 401)

        if (!proxy.token) return c.json({ error: "No valid token found" }, 401)

        const body = c.req.valid("json")
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${proxy.token}`,
          ...buildZodeHeaders(undefined, { zodecodeOrganizationId: proxy.organizationId }),
          [HEADER_FEATURE]: "vscode-extension",
        }

        const response = await fetch(`${ZODE_API_BASE}/api/gateway/v1/audio/transcriptions`, {
          method: "POST",
          headers,
          signal: c.req.raw.signal,
          body: JSON.stringify(body),
        })

        const text = await response.text()
        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          },
        })
      },
    )
    .get(
      "/notifications",
      describeRoute({
        summary: "Get Zode notifications",
        description: "Fetch notifications from Zode Gateway for CLI display",
        operationId: "zode.notifications",
        responses: {
          200: {
            description: "Notifications list",
            content: {
              "application/json": {
                schema: resolver(z.array(ZodecodeNotificationSchema)),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      async (c: any) => {
        return c.json(await getNotifications(Auth))
      },
    )
    .get(
      "/cloud/session/:id",
      describeRoute({
        summary: "Get cloud session",
        description: "Fetch full session data from the Zode cloud for preview",
        operationId: "zode.cloud.session.get",
        responses: {
          200: {
            description: "Cloud session data",
            content: {
              "application/json": {
                schema: resolver(z.unknown()),
              },
            },
          },
          ...errors(401, 404),
        },
      }),
      validator("param", z.object({ id: z.string() })),
      async (c: any) => {
        try {
          const auth = await Auth.get("zode")
          if (!auth) return c.json({ error: "Not authenticated with Zode Gateway" }, 401)
          const token = auth.type === "api" ? auth.key : auth.type === "oauth" ? auth.access : undefined
          if (!token) return c.json({ error: "No valid token found" }, 401)

          const { id } = c.req.valid("param")
          const result = await fetchCloudSession(token, id)
          if (!result.ok) return c.json({ error: result.error }, result.status)
          return c.json(result.data)
        } catch (err: any) {
          console.error("[Zode Gateway] cloud/session/get: unhandled error", err?.message ?? err)
          return c.json({ error: "Internal error" }, 500)
        }
      },
    )
    .post(
      "/cloud/session/import",
      describeRoute({
        summary: "Import session from cloud",
        description: "Download a cloud-synced session and write it to local storage with fresh IDs.",
        operationId: "zode.cloud.session.import",
        responses: {
          200: {
            description: "Imported session info",
            content: {
              "application/json": {
                schema: resolver(z.unknown()),
              },
            },
          },
          ...errors(400, 401, 404),
        },
      }),
      validator(
        "json",
        z.object({
          sessionId: z.string(),
        }),
      ),
      async (c: any) => {
        try {
          const { sessionId } = c.req.valid("json")

          const auth = await Auth.get("zode")
          if (!auth) return c.json({ error: "Not authenticated with Zode" }, 401)
          const token = auth.type === "api" ? auth.key : auth.type === "oauth" ? auth.access : undefined
          if (!token) return c.json({ error: "No valid token found" }, 401)

          const fetched = await fetchCloudSessionForImport(token, sessionId)
          if (!fetched.ok) return c.json({ error: fetched.error }, fetched.status as any)

          const data = fetched.data
          if (!data?.info?.id) return c.json({ error: "Invalid export data" }, 400)

          const info = importSessionToDb(data, {
            Database,
            Instance,
            SessionTable,
            MessageTable,
            PartTable,
            SessionToRow,
            Bus,
            SessionCreatedEvent,
            Identifier,
          })

          return c.json(info)
        } catch (err: any) {
          console.error("[Zode Gateway] cloud/session/import: unhandled error", err?.message ?? err)
          return c.json({ error: "Internal error" }, 500)
        }
      },
    )
    .get(
      "/claw/status",
      describeRoute({
        summary: "Get ZodeClaw instance status",
        description: "Fetch the user's ZodeClaw instance status via the ZodeClaw worker",
        operationId: "zode.claw.status",
        responses: {
          200: {
            description: "Instance status",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    // `recovering` and `restoring` are transitional states the
                    // worker reports while it brings an instance back online
                    // after an unexpected stop or a snapshot restore — see
                    // cloud `services/zodeclaw/src/index.ts` and the
                    // `PlatformStatusResponse` type in
                    // cloud/apps/web/src/lib/zodeclaw/types.ts. Keeping them in
                    // the enum so the SDK types stay accurate.
                    status: z
                      .enum([
                        "provisioned",
                        "starting",
                        "restarting",
                        "recovering",
                        "running",
                        "stopped",
                        "destroying",
                        "restoring",
                      ])
                      .nullable(),
                    sandboxId: z.string().optional(),
                    flyRegion: z.string().optional(),
                    machineSize: z.object({ cpus: z.number(), memory_mb: z.number() }).optional(),
                    openclawVersion: z.string().nullable().optional(),
                    lastStartedAt: z.string().nullable().optional(),
                    lastStoppedAt: z.string().nullable().optional(),
                    channelCount: z.number().optional(),
                    secretCount: z.number().optional(),
                    userId: z.string().optional(),
                    botName: z.string().nullable().optional(),
                  }),
                ),
              },
            },
          },
          ...errors(401, 502),
        },
      }),
      async (c: any) => {
        try {
          return c.json(await getClawStatus(Auth))
        } catch (err: any) {
          if (err instanceof GatewayError) {
            return c.json({ error: `ZodeClaw request failed: ${err.status} ${err.message}` }, err.status as any)
          }
          console.error("[Zode Gateway] claw/status: error", err?.message ?? err)
          return c.json({ error: "Failed to reach ZodeClaw" }, 502)
        }
      },
    )
    .get(
      "/claw/chat-credentials",
      describeRoute({
        summary: "Get ZodeClaw chat credentials",
        description:
          "Returns the bearer token and endpoint URLs the client uses to talk to the Zode Chat worker " +
          "and the Event Service. The bearer is the user's existing long-lived Zode JWT — zode-chat and " +
          "event-service both verify it directly with NEXTAUTH_SECRET, so no separate token mint is needed.",
        operationId: "zode.claw.chatCredentials",
        responses: {
          200: {
            description: "Zode Chat credentials or null",
            content: {
              "application/json": {
                schema: resolver(
                  z
                    .object({
                      token: z.string(),
                      expiresAt: z.string(),
                      zodeChatUrl: z.string(),
                      eventServiceUrl: z.string(),
                    })
                    .nullable(),
                ),
              },
            },
          },
          ...errors(401),
        },
      }),
      async (c: any) => {
        try {
          return c.json(await getClawChatCredentials(Auth))
        } catch (err) {
          if (!(err instanceof UnauthorizedError)) throw err
          return c.json({ error: "Not authenticated with Zode Gateway" }, 401)
        }
      },
    )
    .get(
      "/cloud-sessions",
      describeRoute({
        summary: "Get cloud sessions",
        description: "Fetch cloud CLI sessions from Zode API",
        operationId: "zode.cloudSessions",
        responses: {
          200: {
            description: "Cloud sessions list",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    cliSessions: z.array(
                      z.object({
                        session_id: z.string(),
                        title: z.string().nullable(),
                        created_at: z.string(),
                        updated_at: z.string(),
                        version: z.number(),
                      }),
                    ),
                    nextCursor: z.string().nullable(),
                  }),
                ),
              },
            },
          },
          ...errors(400, 401),
        },
      }),
      validator(
        "query",
        z.object({
          cursor: z.string().optional(),
          limit: z.coerce.number().optional(),
          gitUrl: z.string().optional(),
        }),
      ),
      async (c: any) => {
        try {
          const auth = await Auth.get("zode")
          if (!auth) return c.json({ error: "Not authenticated with Zode Gateway" }, 401)

          const token = auth.type === "api" ? auth.key : auth.type === "oauth" ? auth.access : undefined
          if (!token) return c.json({ error: "No valid token found" }, 401)

          return c.json(await getCloudSessions(token, c.req.valid("query")))
        } catch (err: any) {
          if (err instanceof GatewayError) return c.json({ error: err.message }, err.status as any)
          console.error("[Zode Gateway] cloud-sessions: unhandled error", err?.message ?? err)
          return c.json({ error: "Internal error" }, 500)
        }
      },
    )
}
