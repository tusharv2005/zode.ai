import type { ZodeClient } from "@zodecode/sdk/v2/client"

export async function hasGit(client: ZodeClient, directory: string): Promise<boolean> {
  return client.project
    .current({ directory })
    .then((r) => r.data?.vcs === "git")
    .catch(() => false)
}
