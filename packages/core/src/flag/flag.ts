import { Config } from "effect"
import { InstallationChannel } from "../installation/version"

function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

// Channels where new experiments default to ON (unstable / internal users).
// Stable channels (`prod`, `latest`) stay opt-in.
const UNSTABLE_CHANNELS = new Set(["dev", "beta", "local"])
function unstableDefault(key: string) {
  return truthy(key) || (!falsy(key) && UNSTABLE_CHANNELS.has(InstallationChannel))
}

function number(key: string) {
  const value = process.env[key]
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const ZODE_EXPERIMENTAL = truthy("ZODE_EXPERIMENTAL")
const ZODE_DISABLE_CLAUDE_CODE = truthy("ZODE_DISABLE_CLAUDE_CODE")
const ZODE_DISABLE_CLAUDE_CODE_SKILLS = ZODE_DISABLE_CLAUDE_CODE || truthy("ZODE_DISABLE_CLAUDE_CODE_SKILLS")
const copy = process.env["ZODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  ZODE_AUTO_SHARE: truthy("ZODE_AUTO_SHARE"),
  ZODE_AUTO_HEAP_SNAPSHOT: truthy("ZODE_AUTO_HEAP_SNAPSHOT"),
  ZODE_GIT_BASH_PATH: process.env["ZODE_GIT_BASH_PATH"],
  ZODE_CONFIG: process.env["ZODE_CONFIG"],
  ZODE_CONFIG_CONTENT: process.env["ZODE_CONFIG_CONTENT"],
  ZODE_DISABLE_AUTOUPDATE: truthy("ZODE_DISABLE_AUTOUPDATE"),
  ZODE_ALWAYS_NOTIFY_UPDATE: truthy("ZODE_ALWAYS_NOTIFY_UPDATE"),
  ZODE_DISABLE_PRUNE: truthy("ZODE_DISABLE_PRUNE"),
  ZODE_DISABLE_TERMINAL_TITLE: truthy("ZODE_DISABLE_TERMINAL_TITLE"),
  ZODE_SHOW_TTFD: truthy("ZODE_SHOW_TTFD"),
  ZODE_PERMISSION: process.env["ZODE_PERMISSION"],
  ZODE_DISABLE_DEFAULT_PLUGINS: truthy("ZODE_DISABLE_DEFAULT_PLUGINS"),
  ZODE_DISABLE_LSP_DOWNLOAD: truthy("ZODE_DISABLE_LSP_DOWNLOAD"),
  ZODE_ENABLE_EXPERIMENTAL_MODELS: truthy("ZODE_ENABLE_EXPERIMENTAL_MODELS"),
  ZODE_DISABLE_AUTOCOMPACT: truthy("ZODE_DISABLE_AUTOCOMPACT"),
  ZODE_DISABLE_MODELS_FETCH: truthy("ZODE_DISABLE_MODELS_FETCH"),
  ZODE_DISABLE_MOUSE: truthy("ZODE_DISABLE_MOUSE"),
  ZODE_DISABLE_CLAUDE_CODE,
  ZODE_DISABLE_CLAUDE_CODE_PROMPT: ZODE_DISABLE_CLAUDE_CODE || truthy("ZODE_DISABLE_CLAUDE_CODE_PROMPT"),
  ZODE_DISABLE_CLAUDE_CODE_SKILLS,
  ZODE_DISABLE_EXTERNAL_SKILLS: truthy("ZODE_DISABLE_EXTERNAL_SKILLS"), // zodecode_change
  // Default-on for dev/beta/local; opt-in for stable. Set
  // ZODE_EXPERIMENTAL_CUSTOMIZE_SKILL=false to force off, =true to force on.
  ZODE_EXPERIMENTAL_CUSTOMIZE_SKILL: unstableDefault("ZODE_EXPERIMENTAL_CUSTOMIZE_SKILL"),
  ZODE_FAKE_VCS: process.env["ZODE_FAKE_VCS"],
  ZODE_SERVER_PASSWORD: process.env["ZODE_SERVER_PASSWORD"],
  ZODE_SERVER_USERNAME: process.env["ZODE_SERVER_USERNAME"],
  ZODE_ENABLE_QUESTION_TOOL: truthy("ZODE_ENABLE_QUESTION_TOOL"),

  // Experimental
  ZODE_EXPERIMENTAL,
  ZODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("ZODE_EXPERIMENTAL_FILEWATCHER").pipe(Config.withDefault(false)),
  ZODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("ZODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ZODE_EXPERIMENTAL_ICON_DISCOVERY: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_ICON_DISCOVERY"),
  ZODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("ZODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  ZODE_ENABLE_EXA: truthy("ZODE_ENABLE_EXA") || ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_EXA"),
  ZODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS: number("ZODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  ZODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX: number("ZODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  ZODE_EXPERIMENTAL_OXFMT: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_OXFMT"),
  ZODE_EXPERIMENTAL_LSP_TY: truthy("ZODE_EXPERIMENTAL_LSP_TY"),
  ZODE_EXPERIMENTAL_LSP_TOOL: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_LSP_TOOL"),
  ZODE_EXPERIMENTAL_PLAN_MODE: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_PLAN_MODE"),
  ZODE_EXPERIMENTAL_SCOUT: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_SCOUT"),
  ZODE_EXPERIMENTAL_MARKDOWN: !falsy("ZODE_EXPERIMENTAL_MARKDOWN"),
  ZODE_ENABLE_PARALLEL: truthy("ZODE_ENABLE_PARALLEL") || truthy("ZODE_EXPERIMENTAL_PARALLEL"),
  ZODE_MODELS_URL: process.env["ZODE_MODELS_URL"],
  ZODE_MODELS_PATH: process.env["ZODE_MODELS_PATH"],
  ZODE_DISABLE_EMBEDDED_WEB_UI: truthy("ZODE_DISABLE_EMBEDDED_WEB_UI"),
  ZODE_DB: process.env["ZODE_DB"],
  ZODE_DISABLE_CHANNEL_DB: truthy("ZODE_DISABLE_CHANNEL_DB"),
  ZODE_SKIP_MIGRATIONS: truthy("ZODE_SKIP_MIGRATIONS"),
  ZODE_STRICT_CONFIG_DEPS: truthy("ZODE_STRICT_CONFIG_DEPS"),

  ZODE_WORKSPACE_ID: process.env["ZODE_WORKSPACE_ID"],
  ZODE_EXPERIMENTAL_WORKSPACES: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_WORKSPACES"),
  ZODE_EXPERIMENTAL_EVENT_SYSTEM: ZODE_EXPERIMENTAL || truthy("ZODE_EXPERIMENTAL_EVENT_SYSTEM"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get ZODE_DISABLE_PROJECT_CONFIG() {
    return truthy("ZODE_DISABLE_PROJECT_CONFIG")
  },
  get ZODE_TUI_CONFIG() {
    return process.env["ZODE_TUI_CONFIG"]
  },
  get ZODE_CONFIG_DIR() {
    return process.env["ZODE_CONFIG_DIR"]
  },
  get ZODE_PURE() {
    return truthy("ZODE_PURE")
  },
  get ZODE_PLUGIN_META_FILE() {
    return process.env["ZODE_PLUGIN_META_FILE"]
  },
  get ZODE_CLIENT() {
    return process.env["ZODE_CLIENT"] ?? "cli"
  },
  // zodecode_change start
  get ZODE_SESSION_RETRY_LIMIT() {
    return number("ZODE_SESSION_RETRY_LIMIT")
  },
  // zodecode_change end
}
