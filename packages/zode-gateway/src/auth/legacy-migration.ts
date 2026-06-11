/**
 * Legacy Zode CLI migration module
 *
 * Migrates authentication from the legacy Zode Code VS Code extension CLI
 * config path (~/.zodecode/cli/config.json) to the new auth.json format.
 */
import fs from "fs/promises"
import os from "os"
import path from "path"

export const LEGACY_CONFIG_PATH = path.join(os.homedir(), ".zodecode", "cli", "config.json")

interface LegacyProvider {
  id: string
  provider: string
  zodecodeToken?: string
  zodecodeModel?: string
  zodecodeOrganizationId?: string
}

interface LegacyConfig {
  providers?: LegacyProvider[]
}

interface LegacyZodeAuth {
  token: string
  organizationId?: string
}

// Auth info types matching opencode's Auth module
type ApiAuth = { type: "api"; key: string }
type OAuthAuth = { type: "oauth"; access: string; refresh: string; expires: number; accountId?: string }
type AuthInfo = ApiAuth | OAuthAuth

/**
 * Extract zode auth from legacy config
 */
function extractZodeAuth(config: LegacyConfig): LegacyZodeAuth | undefined {
  if (!config.providers) return undefined

  const provider = config.providers.find((p) => p.provider === "zodecode")
  if (!provider?.zodecodeToken) return undefined

  return {
    token: provider.zodecodeToken,
    organizationId: provider.zodecodeOrganizationId,
  }
}

/**
 * Migrate Zode authentication from legacy CLI config path.
 *
 * Checks ~/.zodecode/cli/config.json for existing zode credentials
 * and migrates them to the new auth.json format.
 *
 * @param hasZodeAuth - Callback to check if zode auth already exists
 * @param saveZodeAuth - Callback to save the migrated auth
 * @returns true if migration was performed, false otherwise
 */
export async function migrateLegacyZodeAuth(
  hasZodeAuth: () => Promise<boolean>,
  saveZodeAuth: (auth: AuthInfo) => Promise<void>,
): Promise<boolean> {
  // Skip if zode auth already configured
  if (await hasZodeAuth()) return false

  // Check if legacy config exists and parse it
  const content = await fs.readFile(LEGACY_CONFIG_PATH, "utf-8").catch(() => null)
  if (!content) return false

  let config: LegacyConfig | null = null
  try {
    config = JSON.parse(content) as LegacyConfig
  } catch {
    return false
  }

  // Extract zode auth from legacy config
  const legacy = extractZodeAuth(config)
  if (!legacy) return false

  // Migrate to new format
  // Use OAuth format if organization ID present, otherwise API format
  if (legacy.organizationId) {
    await saveZodeAuth({
      type: "oauth",
      access: legacy.token,
      refresh: "",
      expires: 0,
      accountId: legacy.organizationId,
    })
  } else {
    await saveZodeAuth({
      type: "api",
      key: legacy.token,
    })
  }

  return true
}
