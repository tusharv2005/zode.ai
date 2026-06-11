import * as path from "path"
import * as os from "os"

/**
 * Global config dir: ~/.config/zode/ (XDG_CONFIG_HOME/zode)
 * This matches where the CLI reads global config from.
 */
function globalConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(xdg, "zode")
}

export class MarketplacePaths {
  /** Project-scope config file: <workspace>/.zode/zode.json */
  configPath(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".zode", "zode.json")
    return path.join(globalConfigDir(), "zode.json")
  }

  /** Agent install directory (where marketplace agents are written as .md files). */
  agentsDir(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".zode", "agents")
    return path.join(globalConfigDir(), "agents")
  }

  /** Skill install directory (where the marketplace installer writes to). */
  skillsDir(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".zode", "skills")
    return path.join(os.homedir(), ".zode", "skills")
  }
}
