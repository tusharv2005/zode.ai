// zodecode_change - new file

import { Global } from "@opencode-ai/core/global"
import { staticEnvLines, type EditorContext } from "@/zodecode/editor-context"
import type { Provider } from "@/provider/provider"
import type { InstanceContext } from "@/project/instance"

export namespace ZodecodeSystemPrompt {
  export function environment(input: { ctx: InstanceContext; model: Provider.Model; editor?: EditorContext }) {
    return [
      [
        `You are powered by the model named ${input.model.api.id}. The exact model ID is ${input.model.providerID}/${input.model.api.id}`,
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Is directory a git repo: ${input.ctx.project.vcs === "git" ? "yes" : "no"}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `  Project config: .zode/command/*.md, .zode/agent/*.md, zode.json, AGENTS.md. Put new commands and agents in .zode/. Do not use .zodecode/ or .opencode/.`,
        `  Global config: ${Global.Path.config}/ (same structure)`,
        ...staticEnvLines(input.editor),
        `</env>`,
      ].join("\n"),
    ]
  }
}
