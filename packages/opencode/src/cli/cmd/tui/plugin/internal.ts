import HomeFooter from "../feature-plugins/home/footer"
import HomeTips from "../feature-plugins/home/tips"
// zodecode_change start
import HomeNews from "@/zodecode/plugins/home-news"
import HomeOnboarding from "@/zodecode/plugins/home-onboarding"
import ZodeHomeFooter from "@/zodecode/plugins/home-footer"
import ZodeSidebarFooter from "@/zodecode/plugins/sidebar-footer"
import ZodeSidebarBackgroundProcesses from "@/zodecode/plugins/sidebar-background-processes"
import ZodeSidebarPr from "@/zodecode/plugins/sidebar-pr"
import ZodeSidebarUsage from "@/zodecode/plugins/sidebar-usage"
// zodecode_change end
import SidebarContext from "../feature-plugins/sidebar/context"
import SidebarMcp from "../feature-plugins/sidebar/mcp"
import SidebarLsp from "../feature-plugins/sidebar/lsp"
import SidebarTodo from "../feature-plugins/sidebar/todo"
import SidebarFiles from "../feature-plugins/sidebar/files"
import SidebarFooter from "../feature-plugins/sidebar/footer"
import PluginManager from "../feature-plugins/system/plugins"
import SessionV2Debug from "../feature-plugins/system/session-v2"
import WhichKey from "../feature-plugins/system/which-key"
import type { TuiPlugin, TuiPluginModule } from "@zodecode/plugin/tui"
import { Flag } from "@opencode-ai/core/flag/flag"

export type InternalTuiPlugin = Omit<TuiPluginModule, "id"> & {
  id: string
  tui: TuiPlugin
  enabled?: boolean
}

export const INTERNAL_TUI_PLUGINS: InternalTuiPlugin[] = [
  HomeNews, // zodecode_change
  HomeOnboarding, // zodecode_change
  ZodeHomeFooter, // zodecode_change
  ZodeSidebarFooter, // zodecode_change
  ZodeSidebarBackgroundProcesses, // zodecode_change
  ZodeSidebarPr, // zodecode_change
  ZodeSidebarUsage, // zodecode_change
  HomeFooter,
  HomeTips,
  SidebarContext,
  SidebarMcp,
  SidebarLsp,
  SidebarTodo,
  SidebarFiles,
  SidebarFooter,
  PluginManager,
  WhichKey,
  ...(Flag.ZODE_EXPERIMENTAL_EVENT_SYSTEM ? [SessionV2Debug] : []),
]
