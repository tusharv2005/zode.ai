// ZodeClaw root component

import { Switch, Match } from "solid-js"
import { ThemeProvider } from "@zodecode/zode-ui/theme"
import { MarkedProvider } from "@zodecode/zode-ui/context/marked"
import { Button } from "@zodecode/zode-ui/button"
import { Spinner } from "@zodecode/zode-ui/spinner"
import { Toast } from "@zodecode/zode-ui/toast"
import { ClawProvider, useClaw } from "./context/claw"
import { ZodeClawLanguageProvider, useZodeClawLanguage } from "./context/language"
import { ConversationList } from "./components/ConversationList"
import { MessageArea } from "./components/MessageArea"
import { StatusSidebar } from "./components/StatusSidebar"
import { SetupView } from "./components/SetupView"
import { UpgradeView } from "./components/UpgradeView"

function Content() {
  const claw = useClaw()
  const { t } = useZodeClawLanguage()

  return (
    <div class="zodeclaw-root">
      <Switch>
        <Match when={claw.phase() === "loading"}>
          <div class="zodeclaw-center">
            <div class="zodeclaw-loading">
              <Spinner />
              <span>{t("zodeClaw.loading")}</span>
            </div>
          </div>
        </Match>
        <Match when={claw.phase() === "noInstance"}>
          <SetupView />
        </Match>
        <Match when={claw.phase() === "needsUpgrade"}>
          <UpgradeView />
        </Match>
        <Match when={claw.phase() === "error"}>
          <div class="zodeclaw-center">
            <div class="zodeclaw-error-view">
              <span class="zodeclaw-error-text">{claw.error()}</span>
              <Button variant="primary" onClick={() => claw.retry()}>
                {t("zodeClaw.error.retry")}
              </Button>
            </div>
          </div>
        </Match>
        <Match when={claw.phase() === "ready"}>
          <div class="zodeclaw-layout">
            <ConversationList />
            <MessageArea />
            <StatusSidebar />
          </div>
        </Match>
      </Switch>
      <Toast.Region />
    </div>
  )
}

export function ZodeClawApp() {
  return (
    <ThemeProvider defaultTheme="zode-vscode">
      <ClawProvider>
        <LanguageBridge>
          <MarkedProvider>
            <Content />
          </MarkedProvider>
        </LanguageBridge>
      </ClawProvider>
    </ThemeProvider>
  )
}

/** Bridges the claw context locale into the language provider. Must be below ClawProvider. */
function LanguageBridge(props: { children: any }) {
  const claw = useClaw()
  return <ZodeClawLanguageProvider locale={claw.locale}>{props.children}</ZodeClawLanguageProvider>
}
