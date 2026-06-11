import type { ZodeClient } from "@zodecode/sdk/v2/client"

export async function abortSession(input: { client: ZodeClient; sessionID: string; dir: string }) {
  await input.client.session.abort({ sessionID: input.sessionID, directory: input.dir }, { throwOnError: true })
}
