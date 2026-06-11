import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "@/server/routes/instance/httpapi/middleware/authorization"
import { InstanceContextMiddleware } from "@/server/routes/instance/httpapi/middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "@/server/routes/instance/httpapi/middleware/workspace-routing"
import { described } from "@/server/routes/instance/httpapi/groups/metadata"

const root = "/zode"

export const Organization = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  role: Schema.String,
})

export const Profile = Schema.Struct({
  email: Schema.String,
  name: Schema.optional(Schema.String),
  organizations: Schema.optional(Schema.Array(Organization)),
})

export const Balance = Schema.Struct({
  balance: Schema.Finite,
})

export const ProfileWithBalance = Schema.Struct({
  profile: Profile,
  balance: Schema.NullOr(Balance),
  currentOrgId: Schema.NullOr(Schema.String),
})

export const NotificationAction = Schema.Struct({
  actionText: Schema.String,
  actionURL: Schema.String,
})

export const Notification = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  message: Schema.String,
  action: Schema.optional(NotificationAction),
  showIn: Schema.optional(Schema.Array(Schema.String)),
  suggestModelId: Schema.optional(Schema.String),
})

export const OrganizationBody = Schema.Struct({
  organizationId: Schema.NullOr(Schema.String),
})

export const ClawStatus = Schema.Struct({
  status: Schema.NullOr(
    Schema.Literals([
      "provisioned",
      "starting",
      "restarting",
      "recovering",
      "running",
      "stopped",
      "destroying",
      "restoring",
    ]),
  ),
  sandboxId: Schema.optional(Schema.String),
  flyRegion: Schema.optional(Schema.String),
  machineSize: Schema.optional(
    Schema.Struct({
      cpus: Schema.Finite,
      memory_mb: Schema.Finite,
    }),
  ),
  openclawVersion: Schema.optional(Schema.NullOr(Schema.String)),
  lastStartedAt: Schema.optional(Schema.NullOr(Schema.String)),
  lastStoppedAt: Schema.optional(Schema.NullOr(Schema.String)),
  channelCount: Schema.optional(Schema.Finite),
  secretCount: Schema.optional(Schema.Finite),
  userId: Schema.optional(Schema.String),
  botName: Schema.optional(Schema.NullOr(Schema.String)),
})

export const ClawChatCredentials = Schema.NullOr(
  Schema.Struct({
    token: Schema.String,
    expiresAt: Schema.String,
    zodeChatUrl: Schema.String,
    eventServiceUrl: Schema.String,
  }),
)

export const CloudSession = Schema.Struct({
  session_id: Schema.String,
  title: Schema.NullOr(Schema.String),
  created_at: Schema.String,
  updated_at: Schema.String,
  version: Schema.Finite,
})

export const CloudSessions = Schema.Struct({
  cliSessions: Schema.Array(CloudSession),
  nextCursor: Schema.NullOr(Schema.String),
})

export const CloudSessionImportBody = Schema.Struct({
  sessionId: Schema.String,
})

const GroupEntry = Schema.Union([
  Schema.String,
  Schema.Tuple([
    Schema.String,
    Schema.Struct({
      fileRegex: Schema.optional(Schema.String),
      description: Schema.optional(Schema.String),
    }),
  ]),
])

export const OrganizationMode = Schema.Struct({
  id: Schema.String,
  organization_id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  created_by: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
  config: Schema.Struct({
    roleDefinition: Schema.optional(Schema.String),
    whenToUse: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    customInstructions: Schema.optional(Schema.String),
    groups: Schema.optional(Schema.Array(GroupEntry)),
  }),
})

export const OrganizationModes = Schema.Struct({
  modes: Schema.Array(OrganizationMode),
})

export const FimBody = Schema.Struct({
  prefix: Schema.String,
  suffix: Schema.String,
  provider: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  maxTokens: Schema.optional(Schema.Finite),
  temperature: Schema.optional(Schema.Finite),
})

// Next Edit (NES) — non-streaming. Clients send structured editor context; the
// gateway assembles the Mercury sentinel-tagged prompt (contract documented at
// https://docs.inceptionlabs.ai/capabilities/next-edit) so the prompt format
// lives in one place and is shared across editors.
export const EditBody = Schema.Struct({
  provider: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  maxTokens: Schema.optional(Schema.Finite),
  currentFilePath: Schema.String,
  currentFileContent: Schema.String,
  cursorLine: Schema.Finite,
  cursorCharacter: Schema.Finite,
  editableRegionStartLine: Schema.Finite,
  editableRegionEndLine: Schema.Finite,
  recentlyViewedSnippets: Schema.Array(Schema.Struct({ filepath: Schema.String, content: Schema.String })),
  editDiffHistory: Schema.Array(Schema.String),
})

export const EditResponse = Schema.Struct({
  content: Schema.String,
  usage: Schema.optional(
    Schema.Struct({
      prompt_tokens: Schema.optional(Schema.Finite),
      completion_tokens: Schema.optional(Schema.Finite),
    }),
  ),
})

export const AudioTranscriptionsBody = Schema.Struct({
  model: Schema.String,
  input_audio: Schema.Struct({
    data: Schema.String,
    format: Schema.String,
  }),
  language: Schema.optional(Schema.String),
  prompt: Schema.optional(Schema.String),
  temperature: Schema.optional(Schema.Finite),
})

export const TranscriptionResponse = Schema.Struct({
  text: Schema.String,
  usage: Schema.optional(Schema.Unknown),
})

const UnknownRecord = Schema.Record(Schema.String, Schema.Unknown)

export const CloudMessage = Schema.StructWithRest(
  Schema.Struct({
    info: Schema.StructWithRest(
      Schema.Struct({
        id: Schema.String,
        sessionID: Schema.String,
        role: Schema.Literals(["user", "assistant"]),
        time: Schema.Struct({
          created: Schema.Finite,
          completed: Schema.optional(Schema.Finite),
        }),
      }),
      [UnknownRecord],
    ),
    parts: Schema.Array(
      Schema.StructWithRest(
        Schema.Struct({
          id: Schema.String,
          sessionID: Schema.String,
          messageID: Schema.String,
          type: Schema.String,
        }),
        [UnknownRecord],
      ),
    ),
  }),
  [UnknownRecord],
)

export const CloudSessionData = Schema.Struct({
  info: Schema.StructWithRest(
    Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      time: Schema.Struct({
        created: Schema.Finite,
        updated: Schema.Finite,
      }),
    }),
    [UnknownRecord],
  ),
  messages: Schema.Array(CloudMessage),
})

export const ZodeGatewayPaths = {
  modes: `${root}/modes`,
  profile: `${root}/profile`,
  fim: `${root}/fim`,
  edit: `${root}/edit`,
  audioTranscriptions: `${root}/audio/transcriptions`,
  notifications: `${root}/notifications`,
  organization: `${root}/organization`,
  clawStatus: `${root}/claw/status`,
  clawChatCredentials: `${root}/claw/chat-credentials`,
  cloudSessions: `${root}/cloud-sessions`,
  cloudSession: `${root}/cloud/session/:id`,
  cloudSessionImport: `${root}/cloud/session/import`,
} as const

export const ZodeGatewayApi = HttpApi.make("zode")
  .add(
    HttpApiGroup.make("zode")
      .add(
        HttpApiEndpoint.get("profile", ZodeGatewayPaths.profile, {
          query: WorkspaceRoutingQuery,
          success: described(ProfileWithBalance, "Profile data"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.profile",
            summary: "Get Zode Gateway profile",
            description: "Fetch user profile and organizations from Zode Gateway",
          }),
        ),
        HttpApiEndpoint.get("modes", ZodeGatewayPaths.modes, {
          query: WorkspaceRoutingQuery,
          success: described(OrganizationModes, "Organization modes list"),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.modes",
            summary: "Get organization custom modes",
            description: "Fetch custom modes defined for the current organization",
          }),
        ),
        HttpApiEndpoint.post("fim", ZodeGatewayPaths.fim, {
          query: WorkspaceRoutingQuery,
          payload: FimBody,
          success: Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/event-stream" })),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.fim",
            summary: "FIM completion",
            description: "Proxy a Fill-in-the-Middle completion request to the Zode Gateway",
          }),
        ),
        HttpApiEndpoint.post("edit", ZodeGatewayPaths.edit, {
          query: WorkspaceRoutingQuery,
          payload: EditBody,
          success: described(EditResponse, "Next Edit completion"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.edit",
            summary: "Next Edit completion",
            description:
              "Proxy a Mercury-style Next Edit request. The client supplies structured editor " +
              "context; the gateway assembles the sentinel-tagged prompt and forwards to the upstream edit endpoint.",
          }),
        ),
        HttpApiEndpoint.post("audioTranscriptions", ZodeGatewayPaths.audioTranscriptions, {
          query: WorkspaceRoutingQuery,
          payload: AudioTranscriptionsBody,
          success: described(TranscriptionResponse, "Transcription response"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.audio.transcriptions",
            summary: "Speech to text transcription",
            description: "Proxy an audio transcription request to the Zode Gateway",
          }),
        ),
        HttpApiEndpoint.get("notifications", ZodeGatewayPaths.notifications, {
          query: WorkspaceRoutingQuery,
          success: described(Schema.Array(Notification), "Notifications list"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.notifications",
            summary: "Get Zode notifications",
            description: "Fetch notifications from Zode Gateway for CLI display",
          }),
        ),
        HttpApiEndpoint.post("organization", ZodeGatewayPaths.organization, {
          query: WorkspaceRoutingQuery,
          payload: OrganizationBody,
          success: described(Schema.Boolean, "Organization updated successfully"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.organization.set",
            summary: "Update Zode Gateway organization",
            description: "Switch to a different Zode Gateway organization",
          }),
        ),
        HttpApiEndpoint.get("clawStatus", ZodeGatewayPaths.clawStatus, {
          query: WorkspaceRoutingQuery,
          success: described(ClawStatus, "Instance status"),
          error: [HttpApiError.Unauthorized, HttpApiError.ServiceUnavailable],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.claw.status",
            summary: "Get ZodeClaw instance status",
            description: "Fetch the user's ZodeClaw instance status via the ZodeClaw worker",
          }),
        ),
        HttpApiEndpoint.get("clawChatCredentials", ZodeGatewayPaths.clawChatCredentials, {
          query: WorkspaceRoutingQuery,
          success: described(ClawChatCredentials, "Zode Chat credentials or null"),
          error: HttpApiError.Unauthorized,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.claw.chatCredentials",
            summary: "Get ZodeClaw chat credentials",
            description:
              "Returns the bearer token and endpoint URLs the client uses to talk to the Zode Chat worker " +
              "and the Event Service. The bearer is the user's existing long-lived Zode JWT — zode-chat and " +
              "event-service both verify it directly with NEXTAUTH_SECRET, so no separate token mint is needed.",
          }),
        ),
        HttpApiEndpoint.get("cloudSessions", ZodeGatewayPaths.cloudSessions, {
          query: {
            ...WorkspaceRoutingQueryFields,
            cursor: Schema.optional(Schema.String),
            limit: Schema.optional(Schema.String),
            gitUrl: Schema.optional(Schema.String),
          },
          success: described(CloudSessions, "Cloud sessions list"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.cloudSessions",
            summary: "Get cloud sessions",
            description: "Fetch cloud CLI sessions from Zode API",
          }),
        ),
        HttpApiEndpoint.get("cloudSession", ZodeGatewayPaths.cloudSession, {
          params: { id: Schema.String },
          query: WorkspaceRoutingQuery,
          success: described(CloudSessionData, "Cloud session data"),
          error: [HttpApiError.Unauthorized, HttpApiError.NotFound],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.cloud.session.get",
            summary: "Get cloud session",
            description: "Fetch full session data from the Zode cloud for preview",
          }),
        ),
        HttpApiEndpoint.post("cloudSessionImport", ZodeGatewayPaths.cloudSessionImport, {
          query: WorkspaceRoutingQuery,
          payload: CloudSessionImportBody,
          success: described(CloudSessionData.fields.info, "Imported session info"),
          error: [HttpApiError.BadRequest, HttpApiError.Unauthorized, HttpApiError.NotFound],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "zode.cloud.session.import",
            summary: "Import session from cloud",
            description: "Download a cloud-synced session and write it to local storage with fresh IDs.",
          }),
        ),
      )
      .annotateMerge(
        OpenApi.annotations({
          title: "zode",
          description: "Zode Gateway routes.",
        }),
      )
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(Authorization),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "zode HttpApi",
      version: "0.0.1",
      description: "Zode HttpApi surface.",
    }),
  )
