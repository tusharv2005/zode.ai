/**
 * ZodeClaw VS Code extension message types.
 *
 * Defines the postMessage protocol between the extension host (Node.js)
 * and the ZodeClaw webview (SolidJS). The extension host owns all network
 * connections (Zode Chat HTTP + event-service WebSocket) and relays data
 * to the webview.
 *
 * SYNC: Shared types are mirrored in webview-ui/zodeclaw/lib/types.ts —
 * keep both in sync.
 */

// ── Instance status (ZodeClaw worker) ───────────────────────────────

export type ClawStatus = {
  // `recovering` and `restoring` are transitional states the worker reports
  // while bringing an instance back from an unexpected stop or a snapshot
  // restore (cloud: `services/zodeclaw/src/index.ts`).
  status:
    | "provisioned"
    | "starting"
    | "restarting"
    | "recovering"
    | "running"
    | "stopped"
    | "destroying"
    | "restoring"
    | null
  sandboxId?: string
  flyRegion?: string
  machineSize?: { cpus: number; memory_mb: number }
  openclawVersion?: string | null
  lastStartedAt?: string | null
  lastStoppedAt?: string | null
  channelCount?: number
  secretCount?: number
  userId?: string
  botName?: string | null
}

// ── Zode Chat token envelope (gateway response) ─────────────────────

export type ChatToken = {
  token: string
  expiresAt: string // ISO timestamp
  zodeChatUrl: string
  eventServiceUrl: string
}

// ── Zode Chat content blocks ────────────────────────────────────────
// Mirrors `@zodecode/zode-chat` schemas. See cloud/packages/zode-chat/src/schemas.ts.

export type ExecApprovalDecision = "allow-once" | "allow-always" | "deny"

export type TextBlock = { type: "text"; text: string }

export type ActionItem = {
  label: string
  style: "primary" | "danger" | "secondary"
  value: ExecApprovalDecision
}

export type ActionsBlock = {
  type: "actions"
  groupId: string
  actions: ActionItem[]
  resolved?: {
    value: ExecApprovalDecision
    resolvedBy: string
    resolvedAt: number
  }
}

export type ContentBlock = TextBlock | ActionsBlock

// ── Zode Chat reactions ─────────────────────────────────────────────

export type ReactionSummary = {
  emoji: string
  count: number
  memberIds: string[]
}

// ── Zode Chat message ───────────────────────────────────────────────

export type Message = {
  id: string
  senderId: string
  content: ContentBlock[]
  inReplyToMessageId: string | null
  updatedAt: number | null
  clientUpdatedAt: number | null
  deleted: boolean
  deliveryFailed: boolean
  reactions: ReactionSummary[]
}

// ── Conversations ───────────────────────────────────────────────────

export type ConversationListItem = {
  conversationId: string
  title: string | null
  lastActivityAt: number | null
  lastReadAt: number | null
  joinedAt: number
}

export type ConversationMember = { id: string; kind: "user" | "bot" }

export type ConversationDetail = {
  id: string
  title: string | null
  createdBy: string
  createdAt: number
  members: ConversationMember[]
}

// ── Bot / conversation status (telemetry) ───────────────────────────

export type BotStatusRecord = {
  online: boolean
  at: number
  updatedAt: number
}

export type ConversationStatusRecord = {
  conversationId: string
  contextTokens: number
  contextWindow: number
  model: string | null
  provider: string | null
  at: number
  updatedAt: number
}

// ── Typed Zode Chat events (server → client) ───────────────────────
// Event names mirror `@zodecode/zode-chat/events`.

/**
 * Snapshot of the message that was replied to. Server includes this on
 * `message.created` so clients can render a reply preview without a follow-up
 * fetch. `deleted` mirrors the soft-deletion state at the time of replying.
 */
export type ReplyToSnapshot = {
  messageId: string
  senderId: string
  content: ContentBlock[]
  deleted?: boolean
}

export type MessageCreatedEvent = {
  messageId: string
  senderId: string
  content: ContentBlock[]
  inReplyToMessageId: string | null
  clientId?: string
  replyTo?: ReplyToSnapshot | null
}

export type MessageUpdatedEvent = {
  messageId: string
  content: ContentBlock[]
  clientUpdatedAt: number | null
}

export type MessageDeletedEvent = { messageId: string }
export type MessageDeliveryFailedEvent = { messageId: string }

export type TypingEvent = { memberId: string }
export type TypingStopEvent = { memberId: string }

export type ReactionAddedEvent = { messageId: string; memberId: string; emoji: string; operationId?: string }
export type ReactionRemovedEvent = { messageId: string; memberId: string; emoji: string; operationId?: string }

/**
 * Server fans out the full conversation snapshot on `conversation.created` so
 * clients can append to their list without a follow-up fetch. Older servers may
 * still send only the `conversationId`, so the snapshot is optional.
 */
export type ConversationCreatedEvent = {
  conversationId: string
  conversation?: ConversationListItem
}
export type ConversationRenamedEvent = { conversationId: string; title: string }
export type ConversationLeftEvent = { conversationId: string }
export type ConversationReadEvent = { conversationId: string; memberId: string; lastReadAt: number }
export type ConversationActivityEvent = { conversationId: string; lastActivityAt: number }

export type ActionExecutedEvent = {
  conversationId: string
  messageId: string
  groupId: string
  value: ExecApprovalDecision
  executedBy: string
}
export type ActionDeliveryFailedEvent = {
  conversationId: string
  messageId: string
  groupId: string
}

export type BotStatusEvent = { sandboxId: string; online: boolean; at: number }
export type ConversationStatusEvent = {
  conversationId: string
  contextTokens: number
  contextWindow: number
  model: string | null
  provider: string | null
  at: number
}

export type ZodeChatEventMap = {
  "message.created": MessageCreatedEvent
  "message.updated": MessageUpdatedEvent
  "message.deleted": MessageDeletedEvent
  "message.delivery_failed": MessageDeliveryFailedEvent
  typing: TypingEvent
  "typing.stop": TypingStopEvent
  "reaction.added": ReactionAddedEvent
  "reaction.removed": ReactionRemovedEvent
  "conversation.created": ConversationCreatedEvent
  "conversation.renamed": ConversationRenamedEvent
  "conversation.left": ConversationLeftEvent
  "conversation.read": ConversationReadEvent
  "conversation.activity": ConversationActivityEvent
  "action.executed": ActionExecutedEvent
  "action.delivery_failed": ActionDeliveryFailedEvent
  "bot.status": BotStatusEvent
  "conversation.status": ConversationStatusEvent
}

export type ZodeChatEventName = keyof ZodeChatEventMap

// ── Webview ↔ extension state ───────────────────────────────────────

export type TypingMember = { memberId: string; at: number }

// Full state snapshot pushed to the webview
// Every phase carries `locale` so the webview can resolve translations immediately.
export type ZodeClawState =
  | { phase: "loading"; locale: string }
  | { phase: "noInstance"; locale: string }
  | { phase: "needsUpgrade"; locale: string }
  | { phase: "error"; locale: string; error: string }
  | {
      phase: "ready"
      locale: string
      status: ClawStatus | null
      currentUserId: string
      sandboxId: string
      conversations: ConversationListItem[]
      hasMoreConversations: boolean
      activeConversationId: string | null
      messages: Message[]
      hasMoreMessages: boolean
      botStatus: BotStatusRecord | null
      conversationStatus: ConversationStatusRecord | null
      typingMembers: TypingMember[]
    }

// ── Messages: Webview → Extension Host ──────────────────────────────

export type ZodeClawInMessage =
  | { type: "zodeclaw.ready" }
  | { type: "zodeclaw.openExternal"; url: string }
  | { type: "zodeclaw.selectConversation"; conversationId: string }
  | { type: "zodeclaw.createConversation"; title?: string }
  | { type: "zodeclaw.renameConversation"; conversationId: string; title: string }
  | { type: "zodeclaw.leaveConversation"; conversationId: string }
  | { type: "zodeclaw.loadMoreConversations" }
  | {
      type: "zodeclaw.sendMessage"
      conversationId: string
      content: ContentBlock[]
      inReplyToMessageId?: string
    }
  | { type: "zodeclaw.editMessage"; conversationId: string; messageId: string; content: ContentBlock[] }
  | { type: "zodeclaw.deleteMessage"; conversationId: string; messageId: string }
  | { type: "zodeclaw.loadMoreMessages"; conversationId: string; before: string }
  | { type: "zodeclaw.addReaction"; conversationId: string; messageId: string; emoji: string }
  | { type: "zodeclaw.removeReaction"; conversationId: string; messageId: string; emoji: string }
  | {
      type: "zodeclaw.executeAction"
      conversationId: string
      messageId: string
      groupId: string
      value: ExecApprovalDecision
    }
  | { type: "zodeclaw.sendTyping"; conversationId: string }
  | { type: "zodeclaw.sendTypingStop"; conversationId: string }
  | { type: "zodeclaw.markRead"; conversationId: string }

// ── Messages: Extension Host → Webview ──────────────────────────────

export type ZodeClawOutMessage =
  | { type: "zodeclaw.state"; state: ZodeClawState }
  | { type: "zodeclaw.status"; data: ClawStatus | null }
  | { type: "zodeclaw.locale"; locale: string }
  | { type: "zodeclaw.error"; error: string }
  | { type: "zodeclaw.conversations"; conversations: ConversationListItem[]; hasMore: boolean; replace: boolean }
  | { type: "zodeclaw.activeConversation"; conversationId: string | null }
  | { type: "zodeclaw.messages"; conversationId: string; messages: Message[]; hasMore: boolean; replace: boolean }
  | { type: "zodeclaw.messageOptimistic"; conversationId: string; message: Message }
  | { type: "zodeclaw.messageReplaced"; conversationId: string; pendingId: string; message: Message }
  | { type: "zodeclaw.messageRemoved"; conversationId: string; messageId: string }
  | { type: "zodeclaw.botStatus"; status: BotStatusRecord | null }
  | { type: "zodeclaw.conversationStatus"; status: ConversationStatusRecord | null }
  | { type: "zodeclaw.typing"; conversationId: string; memberId: string }
  | { type: "zodeclaw.typingStop"; conversationId: string; memberId: string }
  | { type: "fontSizeChanged"; fontSize: number }
