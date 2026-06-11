export type ZodeEmbeddingModel = {
  id: string
  name: string
  dimension: number
  scoreThreshold: number
  note?: string
}

export type ZodeEmbeddingModelCatalog = {
  defaultModel: string
  models: ZodeEmbeddingModel[]
  aliases: Record<string, string>
}

export const EMPTY_ZODE_EMBEDDING_MODEL_CATALOG: ZodeEmbeddingModelCatalog = {
  defaultModel: "",
  models: [],
  aliases: {},
}

export function normalizeZodeEmbeddingModelId(model: string | undefined, catalog = EMPTY_ZODE_EMBEDDING_MODEL_CATALOG) {
  if (!model) return undefined
  return catalog.aliases[model] ?? model
}

export function getZodeEmbeddingModel(model: string | undefined, catalog = EMPTY_ZODE_EMBEDDING_MODEL_CATALOG) {
  const id = normalizeZodeEmbeddingModelId(model, catalog)
  return catalog.models.find((item) => item.id === id)
}

export function formatZodeEmbeddingModelLabel(model: ZodeEmbeddingModel): string {
  const note = model.note ? `${model.note}, ` : ""
  return `${model.name} (${note}${model.dimension}d)`
}
