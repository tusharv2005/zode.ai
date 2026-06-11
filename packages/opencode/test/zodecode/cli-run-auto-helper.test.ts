// zodecode_change - new file
import { describe, expect, test } from "bun:test"
import { ZodeRunAuto } from "../../src/zodecode/cli/run-auto"

describe("ZodeRunAuto", () => {
  test("tracks task child sessions without allowing unrelated sessions", () => {
    const state = ZodeRunAuto.create("ses_root")

    expect(ZodeRunAuto.allowed(state, "ses_root")).toBe(true)
    expect(ZodeRunAuto.allowed(state, "ses_child")).toBe(false)

    ZodeRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_root",
      state: {
        metadata: {
          sessionId: "ses_child",
        },
      },
    })

    expect(ZodeRunAuto.allowed(state, "ses_child")).toBe(true)
    expect(ZodeRunAuto.allowed(state, "ses_other")).toBe(false)
  })

  test("ignores malformed or non-root task metadata", () => {
    const state = ZodeRunAuto.create("ses_root")

    ZodeRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_root",
      state: {
        metadata: {
          sessionId: "",
        },
      },
    })
    ZodeRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_other",
      state: {
        metadata: {
          sessionId: "ses_wrong",
        },
      },
    })
    ZodeRunAuto.track(state, {
      type: "text",
      sessionID: "ses_root",
      state: {},
    })

    expect(ZodeRunAuto.allowed(state, "ses_wrong")).toBe(false)
    expect(ZodeRunAuto.allowed(state, "")).toBe(false)
  })
})
