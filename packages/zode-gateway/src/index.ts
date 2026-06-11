// ============================================================================
// Plugin
// ============================================================================
export { ZodeAuthPlugin, default } from "./plugin.js"

// ============================================================================
// Provider
// ============================================================================
export { createZode } from "./provider.js"
export { createZodeDebug } from "./provider-debug.js"
export { zodeCustomLoader } from "./loader.js"
export { buildZodeHeaders, getEditorNameHeader, getFeatureHeader, getDefaultHeaders, getUserAgent } from "./headers.js"

// ============================================================================
// Auth
// ============================================================================
export { authenticateWithDeviceAuth } from "./auth/device-auth.js"
export { authenticateWithDeviceAuthTUI } from "./auth/device-auth-tui.js"
export { getZodeUrlFromToken, isValidZodecodeToken, getApiKey } from "./auth/token.js"
export { poll, formatTimeRemaining } from "./auth/polling.js"
export { migrateLegacyZodeAuth, LEGACY_CONFIG_PATH } from "./auth/legacy-migration.js"

// ============================================================================
// API
// ============================================================================
export {
  fetchProfile,
  fetchBalance,
  fetchProfileWithBalance,
  fetchDefaultModel,
  getZodeProfile,
  getZodeBalance,
  getZodeDefaultModel,
  promptOrganizationSelection,
} from "./api/profile.js"
export { fetchZodeModels, type ZodeModelsResult } from "./api/models.js"
export {
  EMPTY_ZODE_EMBEDDING_MODEL_CATALOG,
  fetchZodeEmbeddingModelCatalog,
  type ZodeEmbeddingModel,
  type ZodeEmbeddingModelCatalog,
} from "./api/embedding-models.js"
export { resolveZodeGatewayBaseUrl, resolveZodeOpenRouterBaseUrl } from "./api/url.js"
export {
  AUTOCOMPLETE_MODELS,
  DEFAULT_AUTOCOMPLETE_MODEL,
  getAutocompleteModel,
  getAutocompleteModelById,
  validAutocompleteModel,
  validAutocompleteProvider,
  type AutocompleteModelDef,
  type AutocompleteProviderID,
} from "./autocomplete.js"
export {
  fetchOrganizationModes,
  clearModesCache,
  type OrganizationMode,
  type OrganizationModeConfig,
} from "./api/modes.js"
export { fetchZodecodeNotifications, type ZodecodeNotification } from "./api/notifications.js"
export { fetchCloudSession, fetchCloudSessionForImport, importSessionToDb } from "./cloud-sessions.js"

// ============================================================================
// Server Routes (optional - requires hono and OpenCode dependencies)
// ============================================================================
export { createZodeRoutes } from "./server/routes.js"
export {
  GatewayError,
  UnauthorizedError,
  getOrganizationId,
  getClawChatCredentials,
  getClawStatus,
  getCloudSessions,
  getNotifications,
  getProfile,
  getToken,
  setOrganization,
} from "./server/handlers.js"

// ============================================================================
// Note: TUI exports moved to separate entry point
// ============================================================================
// For TUI components and commands, import from "@zodecode/zode-gateway/tui"
// This avoids circular dependencies with opencode TUI infrastructure

// ============================================================================
// Types
// ============================================================================
export type {
  // Auth types
  DeviceAuthInitiateResponse,
  DeviceAuthPollResponse,
  Organization,
  ZodecodeProfile,
  ZodecodeBalance,
  PollOptions,
  PollResult,
  // Provider types
  ZodeProvider,
  ZodeProviderOptions,
  ZodeMetadata,
  CustomLoaderResult,
  ProviderInfo,
  LanguageModelV3,
} from "./types.js"

// ============================================================================
// Constants
// ============================================================================
export {
  ENV_ZODE_API_URL,
  DEFAULT_ZODE_API_URL,
  ZODE_API_BASE,
  ZODE_CHAT_URL,
  ZODE_EVENT_SERVICE_URL,
  ZODE_OPENROUTER_BASE,
  POLL_INTERVAL_MS,
  DEFAULT_MODEL,
  DEFAULT_FREE_MODEL,
  TOKEN_EXPIRATION_MS,
  USER_AGENT_BASE,
  CONTENT_TYPE,
  DEFAULT_PROVIDER_NAME,
  ANONYMOUS_API_KEY,
  MODELS_FETCH_TIMEOUT_MS,
  HEADER_ORGANIZATIONID,
  HEADER_TASKID,
  HEADER_PARENT_TASKID,
  HEADER_PROJECTID,
  HEADER_TESTER,
  HEADER_EDITORNAME,
  HEADER_MACHINEID,
  HEADER_FEATURE,
  DEFAULT_EDITOR_NAME,
  ENV_EDITOR_NAME,
  ENV_VERSION,
  TESTER_SUPPRESS_VALUE,
  ENV_FEATURE,
  PROMPTS,
  AI_SDK_PROVIDERS,
} from "./api/constants.js"
