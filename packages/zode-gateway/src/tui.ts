/**
 * Zode Gateway TUI Integration
 *
 * This module provides TUI-specific functionality for zode-gateway.
 * It requires OpenCode TUI dependencies to be injected at runtime.
 *
 * Import from "@zodecode/zode-gateway/tui" for TUI features.
 */

// ============================================================================
// TUI Dependency Injection
// ============================================================================
export { initializeTUIDependencies, getTUIDependencies, areTUIDependenciesInitialized } from "./tui/context.js"
export type { TUIDependencies } from "./tui/types.js"

// ============================================================================
// TUI Helpers
// ============================================================================
export { formatProfileInfo, getOrganizationOptions, getDefaultOrganizationSelection } from "./tui/helpers.js"

// ============================================================================
// NOTE: TUI Components Moved to OpenCode
// ============================================================================
// All TUI components with JSX have been moved to packages/opencode/src/zodecode/
// to ensure correct JSX transpilation with @opentui/solid.
//
// Components moved:
// - registerZodeCommands -> @/zodecode/zode-commands
// - DialogZodeTeamSelect -> @/zodecode/components/dialog-zode-team-select
// - DialogZodeOrganization -> @/zodecode/components/dialog-zode-organization
// - DialogZodeProfile -> @/zodecode/components/dialog-zode-profile
// - ZodeAutoMethod -> @/zodecode/components/dialog-zode-auto-method
// - ZodeNews -> @/zodecode/components/zode-news
// - NotificationBanner -> @/zodecode/components/notification-banner
// - DialogZodeNotifications -> @/zodecode/components/dialog-zode-notifications
