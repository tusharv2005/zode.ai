// zodecode_change - new file
// Zode-specific overrides for the server control plane.
// Imported by ../../server/server.ts with minimal zodecode_change markers.

/** Additional CORS origin check for *.kilo.ai */
export function corsOrigin(input: string): string | undefined {
  if (/^https:\/\/([a-z0-9-]+\.)*zode\.ai$/.test(input)) {
    return input
  }
  return undefined
}

export const DOC_TITLE = "zode"
export const DOC_DESCRIPTION = "zode api"
