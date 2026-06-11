import { type Component } from "solid-js"
import { ThemeProvider } from "@zodecode/zode-ui/theme"
import { DialogProvider } from "@zodecode/zode-ui/context/dialog"
import { Toast } from "@zodecode/zode-ui/toast"
import { MarketplaceView } from "../src/components/marketplace"
import { MarketplaceSessionProvider } from "../src/context/marketplace-session"
import { LanguageBridge } from "../src/context/language-bridge"
import { ServerProvider } from "../src/context/server"
import { VSCodeProvider } from "../src/context/vscode"
import "../src/styles/chat.css"

export const MarketplaceApp: Component = () => {
  return (
    <ThemeProvider defaultTheme="zode-vscode">
      <DialogProvider>
        <VSCodeProvider>
          <ServerProvider>
            <LanguageBridge>
              <MarketplaceSessionProvider>
                <MarketplaceView />
              </MarketplaceSessionProvider>
            </LanguageBridge>
          </ServerProvider>
        </VSCodeProvider>
        <Toast.Region />
      </DialogProvider>
    </ThemeProvider>
  )
}
