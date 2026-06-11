import type { ProviderAuthState } from "../../types/messages"
import type { Provider } from "../../types/messages"
import { ZODE_PROVIDER_ID, createZodeFallbackProvider } from "../../../../src/shared/provider-model"

export function visibleConnectedIds(connected: string[], authStates: Record<string, ProviderAuthState>) {
  return connected.filter((id) => id !== ZODE_PROVIDER_ID || authStates[ZODE_PROVIDER_ID] !== undefined)
}

export function disabledProviderOptions(providers: Record<string, Provider>, disabled: string[]) {
  const current = new Set(disabled)
  return Object.values(providers)
    .filter((item) => !current.has(item.id))
    .map((item) => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function providersWithZodeFallback(providers: Record<string, Provider>): Record<string, Provider> {
  if (providers[ZODE_PROVIDER_ID]) return providers
  return { [ZODE_PROVIDER_ID]: createZodeFallbackProvider(), ...providers }
}
