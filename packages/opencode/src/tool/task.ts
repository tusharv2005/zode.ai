import * as Tool from "./tool"
import DESCRIPTION from "./task.txt"
import { Session } from "@/session/session"
import { SessionID, MessageID } from "../session/schema"
import { MessageV2 } from "../session/message-v2"
import { Agent } from "../agent/agent"
import { deriveSubagentSessionPermission } from "../agent/subagent-permissions"
import type { SessionPrompt } from "../session/prompt"
import { Config } from "@/config/config"
import { Provider } from "@/provider/provider" // zodecode_change
import { ZodeTask } from "../zodecode/tool/task" // zodecode_change
import { ZodeCostPropagation } from "../zodecode/session/cost-propagation" // zodecode_change
import { ZodeSessionProcessor } from "../zodecode/session/processor" // zodecode_change
import { errorMessage } from "@/util/error" // zodecode_change
import { Effect, Exit, Schema } from "effect"
import { EffectBridge } from "@/effect/bridge"

export interface TaskPromptOps {
  cancel(sessionID: SessionID): Effect.Effect<void>
  resolvePromptParts(template: string): Effect.Effect<SessionPrompt.PromptInput["parts"]>
  prompt(input: SessionPrompt.PromptInput): Effect.Effect<MessageV2.WithParts>
}

const id = "task"

export const Parameters = Schema.Struct({
  description: Schema.String.annotate({ description: "A short (3-5 words) description of the task" }),
  prompt: Schema.String.annotate({ description: "The task for the agent to perform" }),
  subagent_type: Schema.String.annotate({ description: "The type of specialized agent to use for this task" }),
  task_id: Schema.optional(Schema.String).annotate({
    description:
      "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)",
  }),
  command: Schema.optional(Schema.String).annotate({ description: "The command that triggered this task" }),
})

export const TaskTool = Tool.define(
  id,
  Effect.gen(function* () {
    const agent = yield* Agent.Service
    const config = yield* Config.Service
    const sessions = yield* Session.Service
    const provider = yield* Provider.Service // zodecode_change

    const run = Effect.fn("TaskTool.execute")(function* (
      params: Schema.Schema.Type<typeof Parameters>,
      ctx: Tool.Context,
    ) {
      const cfg = yield* config.get()

      if (!ctx.extra?.bypassAgentCheck) {
        yield* ctx.ask({
          permission: id,
          patterns: [params.subagent_type],
          always: ["*"],
          metadata: {
            description: params.description,
            subagent_type: params.subagent_type,
          },
        })
      }

      const next = yield* agent.get(params.subagent_type)
      if (!next) {
        return yield* Effect.fail(new Error(`Unknown agent type: ${params.subagent_type} is not a valid agent type`))
      }
      // zodecode_change start — reject primary agents; only subagent/all modes allowed
      ZodeTask.validate(next, params.subagent_type)
      // zodecode_change end

      const canTask = ZodeTask.nestedTask() // zodecode_change - Zode disallows subagents spawning subagents
      const canTodo = next.permission.some((rule) => rule.permission === "todowrite")

      const taskID = params.task_id
      const session = taskID
        ? yield* sessions.get(SessionID.make(taskID)).pipe(Effect.catchCause(() => Effect.succeed(undefined)))
        : undefined
      if (session && session.parentID !== ctx.sessionID) {
        return yield* Effect.fail(new Error(`Cannot resume session ${taskID}: not a child of the current session`)) // zodecode_change - prevent cross-session task resume
      }
      const parent = yield* sessions.get(ctx.sessionID)
      const parentAgent = parent.agent
        ? yield* agent.get(parent.agent).pipe(Effect.catchCause(() => Effect.succeed(undefined)))
        : undefined
      // zodecode_change start — inherit edit/bash/MCP restrictions from calling agent
      const caller = yield* agent.get(ctx.agent)
      const rules = ZodeTask.inherited({ caller, session: parent, mcp: cfg.mcp })
      // zodecode_change end
      // zodecode_change start - refresh current parent restrictions when resuming an existing task session
      if (session) {
        session.permission = ZodeTask.merge(
          session.permission ?? [],
          deriveSubagentSessionPermission({
            parentSessionPermission: parent.permission ?? [],
            parentAgent,
            subagent: next,
          }),
          ZodeTask.permissions(rules),
        )
        yield* sessions.setPermission({ sessionID: session.id, permission: session.permission })
      }
      // zodecode_change end
      const nextSession =
        session ??
        (yield* sessions.create({
          parentID: ctx.sessionID,
          title: params.description + ` (@${next.name} subagent)`,
          // zodecode_change start - dedupe inherited restrictions before child prompt toggles persist
          permission: ZodeTask.merge(
            deriveSubagentSessionPermission({
              parentSessionPermission: parent.permission ?? [],
              parentAgent,
              subagent: next,
            }),
            cfg.experimental?.primary_tools?.map((item) => ({
              pattern: "*",
              action: "allow" as const,
              permission: item,
            })) ?? [],
            ZodeTask.permissions(rules),
          ),
          // zodecode_change end
        }))

      const msg = yield* Effect.sync(() => MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID }))
      if (msg.info.role !== "assistant") return yield* Effect.fail(new Error("Not an assistant message"))

      // zodecode_change start — prefer valid subagent overrides, safely inheriting when overrides go stale
      const selected = yield* ZodeTask.resolveModel({
        name: next.name,
        agent: next,
        config: cfg,
        parent: {
          modelID: msg.info.modelID,
          providerID: msg.info.providerID,
        },
        provider,
      })
      const model = selected.model
      const variant = selected.variant
      // zodecode_change end

      yield* ctx.metadata({
        title: params.description,
        metadata: {
          sessionId: nextSession.id,
          model,
          variant, // zodecode_change
        },
      })

      const ops = ctx.extra?.promptOps as TaskPromptOps
      if (!ops) return yield* Effect.fail(new Error("TaskTool requires promptOps in ctx.extra"))
      const runCancel = yield* EffectBridge.make()

      const messageID = MessageID.ascending()
      const cancel = ops.cancel(nextSession.id)

      function onAbort() {
        runCancel.fork(cancel)
      }

      return yield* Effect.acquireUseRelease(
        // zodecode_change start - snapshot child cost so we propagate only the delta on resume (#6321)
        Effect.gen(function* () {
          ctx.abort.addEventListener("abort", onAbort)
          return yield* ZodeCostPropagation.childCost(sessions, nextSession.id)
        }),
        // zodecode_change end
        () =>
          Effect.gen(function* () {
            const parts = yield* ops.resolvePromptParts(params.prompt)
            ZodeSessionProcessor.markReviewTelemetry(parts, params.command) // zodecode_change - carry review command into child session telemetry
            const result = yield* ops.prompt({
              messageID,
              sessionID: nextSession.id,
              model: {
                modelID: model.modelID,
                providerID: model.providerID,
              },
              variant, // zodecode_change
              agent: next.name,
              tools: {
                ...(canTodo ? {} : { todowrite: false }),
                ...(canTask ? {} : { task: false }),
                ...Object.fromEntries((cfg.experimental?.primary_tools ?? []).map((item) => [item, false])),
              },
              parts,
            })

            // zodecode_change start - expose terminal child assistant errors through the task tool boundary
            if (result.info.role === "assistant" && result.info.error) {
              return yield* Effect.fail(new Error(errorMessage(result.info.error)))
            }
            // zodecode_change end

            return {
              title: params.description,
              metadata: {
                sessionId: nextSession.id,
                model,
                variant, // zodecode_change
              },
              output: [
                `task_id: ${nextSession.id} (for resuming to continue this task if needed)`,
                "",
                "<task_result>",
                result.parts.findLast((item) => item.type === "text")?.text ?? "",
                "</task_result>",
              ].join("\n"),
            }
          }),
        // zodecode_change start - propagate subagent cost delta to parent on every exit path (#6321)
        (costBefore, exit) =>
          Effect.gen(function* () {
            if (Exit.hasInterrupts(exit)) yield* cancel
          }).pipe(
            Effect.ensuring(
              Effect.gen(function* () {
                ctx.abort.removeEventListener("abort", onAbort)
                const costAfter = yield* ZodeCostPropagation.childCost(sessions, nextSession.id)
                yield* ZodeCostPropagation.propagate(sessions, ctx.sessionID, ctx.messageID, costAfter - costBefore)
              }),
            ),
          ),
        // zodecode_change end
      )
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        run(params, ctx).pipe(Effect.orDie),
    }
  }),
)
