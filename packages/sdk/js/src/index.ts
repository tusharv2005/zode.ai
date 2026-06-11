export * from "./client.js"
export * from "./server.js"

import { createZodeClient } from "./client.js"
import { createZodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createZode(options?: ServerOptions) {
  const server = await createZodeServer({
    ...options,
  })

  const client = createZodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
