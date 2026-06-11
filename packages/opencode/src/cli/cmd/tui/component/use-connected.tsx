import { createMemo } from "solid-js"
import { useSync } from "@tui/context/sync"

export function useConnected() {
  const sync = useSync()
  // zodecode_change - exclude "zode" (anonymous autoload) alongside "opencode"
  return createMemo(() =>
    sync.data.provider.some(
      (x) => (x.id !== "opencode" && x.id !== "zode") || Object.values(x.models).some((y) => y.cost?.input !== 0),
    ),
  )
}
