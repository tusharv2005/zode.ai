import { ZodecodeMarkdown } from "../config/markdown"

export namespace ZodecodeInstruction {
  export function content(text: string, item: string) {
    return ZodecodeMarkdown.substitute(text, item)
  }
}
