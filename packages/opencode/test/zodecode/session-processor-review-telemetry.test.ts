// zodecode_change - new file
import { describe, expect, test } from "bun:test"
import { ZodeSessionProcessor } from "../../src/zodecode/session/processor"
import type { MessageV2 } from "../../src/session/message-v2"

const REVIEW_COMMANDS = ["review", "local-review", "local-review-uncommitted"] as const

const expected = (command: (typeof REVIEW_COMMANDS)[number]) => ({
  mode: "review" as const,
  feature: "code_reviews" as const,
  command,
})

describe("ZodeSessionProcessor.reviewTelemetry", () => {
  for (const command of REVIEW_COMMANDS) {
    test(`returns telemetry for ${command}`, () => {
      expect(ZodeSessionProcessor.reviewTelemetry(command)).toEqual(expected(command))
    })
  }

  test("returns undefined for an unrelated command", () => {
    expect(ZodeSessionProcessor.reviewTelemetry("init")).toBeUndefined()
  })

  test("returns undefined for an undefined command", () => {
    expect(ZodeSessionProcessor.reviewTelemetry(undefined)).toBeUndefined()
  })
})

describe("ZodeSessionProcessor.markReviewTelemetry", () => {
  for (const command of REVIEW_COMMANDS) {
    test(`stamps text parts with telemetry for ${command}`, () => {
      const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [
        { type: "text", metadata: { existing: "keep" } },
        { type: "file" },
        { type: "text" },
      ]
      const tel = ZodeSessionProcessor.markReviewTelemetry(parts, command)
      expect(tel).toEqual(expected(command))
      expect(parts[0].metadata).toEqual({ existing: "keep", ...expected(command) })
      expect(parts[1].metadata).toBeUndefined()
      expect(parts[2].metadata).toEqual({ ...expected(command) })
    })
  }

  test("does nothing for an unrelated command", () => {
    const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [{ type: "text" }]
    expect(ZodeSessionProcessor.markReviewTelemetry(parts, "init")).toBeUndefined()
    expect(parts[0].metadata).toBeUndefined()
  })

  test("does nothing for an undefined command", () => {
    const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [{ type: "text" }]
    expect(ZodeSessionProcessor.markReviewTelemetry(parts, undefined)).toBeUndefined()
    expect(parts[0].metadata).toBeUndefined()
  })
})

describe("ZodeSessionProcessor.extractReviewTelemetry", () => {
  for (const command of REVIEW_COMMANDS) {
    test(`recovers ${command} telemetry from marked text parts`, () => {
      const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [{ type: "text" }]
      ZodeSessionProcessor.markReviewTelemetry(parts, command)
      const round = ZodeSessionProcessor.extractReviewTelemetry(parts as unknown as MessageV2.Part[])
      expect(round).toEqual(expected(command))
    })
  }

  test("returns undefined when parts have no review metadata", () => {
    const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [
      { type: "text" },
      { type: "text", metadata: { foo: "bar" } },
    ]
    expect(ZodeSessionProcessor.extractReviewTelemetry(parts as unknown as MessageV2.Part[])).toBeUndefined()
  })

  test("returns undefined when command in metadata is unknown", () => {
    const parts: Array<{ type: string; metadata?: Record<string, unknown> }> = [
      { type: "text", metadata: { mode: "review", feature: "code_reviews", command: "unknown" } },
    ]
    expect(ZodeSessionProcessor.extractReviewTelemetry(parts as unknown as MessageV2.Part[])).toBeUndefined()
  })
})

describe("ZodeSessionProcessor.suggestionReviewTelemetry", () => {
  test("returns suggest-sourced telemetry for accepted review commands", () => {
    expect(
      ZodeSessionProcessor.suggestionReviewTelemetry({
        accepted: { prompt: "/local-review-uncommitted --focus telemetry" },
      }),
    ).toEqual({ ...expected("local-review-uncommitted"), tool: "suggest" })
  })

  test("returns undefined for accepted non-review commands", () => {
    expect(ZodeSessionProcessor.suggestionReviewTelemetry({ accepted: { prompt: "/test" } })).toBeUndefined()
  })

  test("returns undefined when accepted prompt is not a slash command", () => {
    expect(ZodeSessionProcessor.suggestionReviewTelemetry({ accepted: { prompt: "Run tests" } })).toBeUndefined()
  })

  test("returns undefined when accepted metadata is missing", () => {
    expect(ZodeSessionProcessor.suggestionReviewTelemetry({ dismissed: true })).toBeUndefined()
  })
})

describe("ZodeSessionProcessor.extractSuggestionReviewTelemetry", () => {
  test("recovers review telemetry from completed suggest tool metadata", () => {
    const parts = [
      {
        type: "tool",
        tool: "suggest",
        state: {
          status: "completed",
          metadata: { accepted: { prompt: "/local-review" } },
        },
      },
    ]

    expect(ZodeSessionProcessor.extractSuggestionReviewTelemetry(parts as unknown as MessageV2.Part[])).toEqual({
      ...expected("local-review"),
      tool: "suggest",
    })
  })
})
