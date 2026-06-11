import type { DesktopTheme } from "@opencode-ai/ui/theme/types"
import { DEFAULT_THEMES as UPSTREAM_THEMES } from "@opencode-ai/ui/theme/default-themes"
import zodeJson from "./themes/zode.json"
import zodeVscodeJson from "./themes/zode-vscode.json"

// Re-export all upstream theme constants
export {
  oc2Theme,
  tokyonightTheme,
  draculaTheme,
  monokaiTheme,
  solarizedTheme,
  nordTheme,
  catppuccinTheme,
  ayuTheme,
  oneDarkProTheme,
  shadesOfPurpleTheme,
  nightowlTheme,
  vesperTheme,
  carbonfoxTheme,
  gruvboxTheme,
  auraTheme,
} from "@opencode-ai/ui/theme/default-themes"

export const zodeTheme = zodeJson as DesktopTheme
export const zodeVscodeTheme = zodeVscodeJson as DesktopTheme

export const ZODE_THEMES: Record<string, DesktopTheme> = {
  zode: zodeTheme,
  "zode-vscode": zodeVscodeTheme,
}

// Override DEFAULT_THEMES: Zode themes first, then upstream
export const DEFAULT_THEMES: Record<string, DesktopTheme> = {
  ...ZODE_THEMES,
  ...UPSTREAM_THEMES,
}
