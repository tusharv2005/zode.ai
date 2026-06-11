import type { ZodeClient } from "@zodecode/sdk/v2/client"

export async function stopSessionProcesses(
  client: ZodeClient | null,
  sessionID: string,
  directory: string,
): Promise<void> {
  if (!client) return
  await client.backgroundProcess
    .stopSession({ sessionID, directory })
    .catch((err: unknown) => console.warn("[Zode New] ZodeProvider: Failed to stop background processes:", err))
}
