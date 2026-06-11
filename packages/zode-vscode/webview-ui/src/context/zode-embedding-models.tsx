import { createContext, createSignal, onCleanup, useContext, type Accessor, type ParentComponent } from "solid-js"
import {
  EMPTY_ZODE_EMBEDDING_MODEL_CATALOG,
  type ZodeEmbeddingModelCatalog,
} from "@zodecode/zode-indexing/embedding-models"
import { useVSCode } from "./vscode"
import type { ExtensionMessage } from "../types/messages"

type ZodeEmbeddingModelsContextValue = {
  catalog: Accessor<ZodeEmbeddingModelCatalog>
}

export const ZodeEmbeddingModelsContext = createContext<ZodeEmbeddingModelsContextValue>()

export const ZodeEmbeddingModelsProvider: ParentComponent = (props) => {
  const vscode = useVSCode()
  const [catalog, setCatalog] = createSignal<ZodeEmbeddingModelCatalog>(EMPTY_ZODE_EMBEDDING_MODEL_CATALOG)

  const unsubscribe = vscode.onMessage((message: ExtensionMessage) => {
    if (message.type !== "zodeEmbeddingModelsLoaded") return
    setCatalog(message.catalog)
  })

  vscode.postMessage({ type: "requestZodeEmbeddingModels" })

  onCleanup(unsubscribe)

  return <ZodeEmbeddingModelsContext.Provider value={{ catalog }}>{props.children}</ZodeEmbeddingModelsContext.Provider>
}

export function useZodeEmbeddingModels(): ZodeEmbeddingModelsContextValue {
  const context = useContext(ZodeEmbeddingModelsContext)
  if (!context) {
    throw new Error("useZodeEmbeddingModels must be used within a ZodeEmbeddingModelsProvider")
  }
  return context
}
