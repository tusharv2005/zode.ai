import { describe, expect, test } from "bun:test"
import { Effect, Stream } from "effect"
import { ZodeLLM } from "@/zodecode/session/llm"
import type { LLM } from "@/session/llm"

describe("zodecode.session.llm.text", () => {
  test("joins text delta events", async () => {
    const out = await Effect.runPromise(
      ZodeLLM.text(
        Stream.make(
          { type: "text-delta", id: "text", text: "hello ", delta: "hello " } as LLM.Event,
          { type: "text-delta", id: "text", text: "world", delta: "world" } as LLM.Event,
        ),
      ),
    )

    expect(out).toBe("hello world")
  })

  test("fails on error events after partial text", async () => {
    const err = new Error("provider unavailable")
    const text = ZodeLLM.text(
      Stream.make(
        { type: "text-delta", id: "text", text: "partial", delta: "partial" } as LLM.Event,
        { type: "error", error: err } as LLM.Event,
      ),
    )

    await expect(Effect.runPromise(text)).rejects.toThrow("provider unavailable")
  })

  test("fails on abort events", async () => {
    const text = ZodeLLM.text(Stream.make({ type: "abort" } as LLM.Event))

    await expect(Effect.runPromise(text)).rejects.toMatchObject({ name: "AbortError" })
  })
})
