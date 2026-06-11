// ZodeClaw SolidJS webview entry point

import { render } from "solid-js/web"
import "@zodecode/zode-ui/styles"
import "./zodeclaw.css"
import { ZodeClawApp } from "./ZodeClawApp"

const root = document.getElementById("root")
if (root) {
  render(() => <ZodeClawApp />, root)
}
