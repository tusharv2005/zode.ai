// zodecode_change start - reactive TUI config provider enables hot reload (impl in zodecode mirror)
import { ZodeTuiConfig } from "@/zodecode/cli/cmd/tui/context/tui-config"

export const useTuiConfig = ZodeTuiConfig.use
export const TuiConfigProvider = ZodeTuiConfig.Provider
// zodecode_change end
