import { createZodeClient, type ZodeClient } from "@zodecode/sdk/v2"
import { Filesystem } from "@/util/filesystem"
import { DaemonClient } from "@/zodecode/daemon/client"

export namespace ZodeRunDaemon {
  export type Input = {
    directory?: string
    execute: (client: ZodeClient) => Promise<void>
  }

  export async function attach(input: Input) {
    const daemon = await DaemonClient.maybe()
    if (!daemon) return false
    const dir = input.directory ?? Filesystem.resolve(process.cwd())
    const client = createZodeClient({ baseUrl: daemon.url, directory: dir, headers: daemon.headers })
    await input.execute(client)
    return true
  }
}
