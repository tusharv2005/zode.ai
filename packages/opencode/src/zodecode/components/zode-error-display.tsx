import { createMemo, Match, Switch, type JSX } from "solid-js"
import { SplitBorder } from "@tui/component/border"
import { useTheme } from "@tui/context/theme"
import { parseZodeErrorCode, zodeErrorTitle, zodeErrorDescription } from "@/zodecode/zode-errors"
import type { AssistantMessage } from "@zodecode/sdk/v2"

interface ZodeErrorBlockProps {
  error: NonNullable<AssistantMessage["error"]>
  fallback: JSX.Element
}

export function ZodeErrorBlock(props: ZodeErrorBlockProps) {
  const { theme } = useTheme()

  const zodeErrorCode = createMemo(() => {
    return parseZodeErrorCode(props.error)
  })

  const title = createMemo(() => {
    const code = zodeErrorCode()
    return code ? zodeErrorTitle(code) : undefined
  })

  const description = createMemo(() => {
    const code = zodeErrorCode()
    return code ? zodeErrorDescription(code) : undefined
  })

  return (
    <Switch fallback={props.fallback}>
      <Match when={zodeErrorCode()}>
        <box
          border={["left"]}
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          marginTop={1}
          backgroundColor={theme.backgroundPanel}
          customBorderChars={SplitBorder.customBorderChars}
          borderColor={theme.primary}
        >
          <text fg={theme.text}>{title()}</text>
          <text fg={theme.textMuted}>{description()}</text>
          <text fg={theme.primary}>{"Run /connect or `zode auth login` to connect to Zode Gateway"}</text>
        </box>
      </Match>
    </Switch>
  )
}
