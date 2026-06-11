import path from "path"
import { fileURLToPath } from "url"
import { prepareModelsSnapshot } from "./zodecode/models-snapshot" // zodecode_change

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

// zodecode_change start
const snapshot = await prepareModelsSnapshot()
console.log(`Generated models-snapshot.json (${snapshot.providers} providers, ${snapshot.models} models)`)
// zodecode_change end
