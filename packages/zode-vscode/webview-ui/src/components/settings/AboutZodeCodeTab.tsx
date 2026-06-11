import { Component, createSignal, onCleanup } from "solid-js"
import { Button } from "@zodecode/zode-ui/button"
import { Icon } from "@zodecode/zode-ui/icon"
import { showToast } from "@zodecode/zode-ui/toast"
import { useLanguage } from "../../context/language"
import { useVSCode } from "../../context/vscode"
import { useConfig } from "../../context/config"
import type { Config, ConnectionState, ExtensionMessage } from "../../types/messages"
import { buildExport, parseImport, MAX_IMPORT_SIZE } from "./settings-io"

export interface AboutZodeCodeTabProps {
  port: number | null
  connectionState: ConnectionState
  extensionVersion?: string
  onMigrateClick?: () => void // legacy-migration
}

const AboutZodeCodeTab: Component<AboutZodeCodeTabProps> = (props) => {
  const language = useLanguage()
  const vscode = useVSCode()
  const { updateConfig, updateGlobalConfig } = useConfig()
  const [importing, setImporting] = createSignal(false)
  const [exporting, setExporting] = createSignal(false)
  let epoch = 0

  const open = (url: string) => {
    vscode.postMessage({ type: "openExternal", url })
  }

  const importConfig = (config: Config) => {
    const enabled = config.indexing?.enabled
    if (enabled === undefined) {
      updateConfig(config)
      return
    }

    const indexing = { ...config.indexing }
    delete indexing.enabled
    const next = { ...config }
    if (Object.keys(indexing).length > 0) next.indexing = indexing
    else delete next.indexing

    updateConfig(next)
    updateGlobalConfig({ indexing: { enabled } })
  }

  // Listen for globalConfigLoaded response
  const handler = (event: MessageEvent) => {
    const msg = event.data as ExtensionMessage
    if (msg.type !== "globalConfigLoaded" || !exporting()) return
    setExporting(false)
    epoch++
    const payload = buildExport(msg.config)
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "zode-settings.json"
    a.click()
    URL.revokeObjectURL(url)
  }
  window.addEventListener("message", handler)
  onCleanup(() => window.removeEventListener("message", handler))

  // ----- Export -----
  const handleExport = () => {
    if (exporting()) return
    setExporting(true)
    const token = ++epoch
    vscode.postMessage({ type: "requestGlobalConfig" })
    setTimeout(() => {
      if (epoch === token) setExporting(false)
    }, 5000)
  }

  // ----- Import -----
  const handleImport = () => {
    if (importing()) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.style.display = "none"
    input.addEventListener("change", () => {
      const file = input.files?.[0]
      if (!file) return
      if (file.size > MAX_IMPORT_SIZE) {
        showToast({ variant: "error", title: language.t("settings.aboutZodeCode.importSettings.tooLarge") })
        return
      }
      setImporting(true)
      const reader = new FileReader()
      reader.onload = () => {
        setImporting(false)
        const text = reader.result as string
        const result = parseImport(text)
        if (!result.ok) {
          const key =
            result.error === "invalidJson"
              ? "settings.aboutZodeCode.importSettings.invalidJson"
              : "settings.aboutZodeCode.importSettings.invalidConfig"
          showToast({ variant: "error", title: language.t(key) })
          return
        }
        if (result.warning === "newerVersion") {
          showToast({
            variant: "default",
            title: language.t("settings.aboutZodeCode.importSettings.newerVersion"),
          })
        }
        importConfig(result.config)
        showToast({
          variant: "success",
          title: language.t("settings.aboutZodeCode.importSettings.success"),
        })
      }
      reader.onerror = () => {
        setImporting(false)
        showToast({ variant: "error", title: language.t("settings.aboutZodeCode.importSettings.invalidJson") })
      }
      reader.readAsText(file)
    })
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }

  const getStatusColor = () => {
    switch (props.connectionState) {
      case "connected":
        return "var(--vscode-testing-iconPassed, #89d185)"
      case "connecting":
        return "var(--vscode-testing-iconQueued, #cca700)"
      case "disconnected":
        return "var(--vscode-testing-iconFailed, #f14c4c)"
      case "error":
        return "var(--vscode-testing-iconFailed, #f14c4c)"
    }
  }

  const getStatusText = () => {
    switch (props.connectionState) {
      case "connected":
        return language.t("settings.aboutZodeCode.status.connected")
      case "connecting":
        return language.t("settings.aboutZodeCode.status.connecting")
      case "disconnected":
        return language.t("settings.aboutZodeCode.status.disconnected")
      case "error":
        return language.t("settings.aboutZodeCode.status.error")
    }
  }

  const linkStyle = {
    color: "var(--vscode-textLink-foreground)",
    "text-decoration": "none",
    cursor: "pointer",
  } as const

  const sectionStyle = {
    background: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-panel-border)",
    "border-radius": "4px",
    padding: "16px",
    "margin-bottom": "16px",
  } as const

  const headingStyle = {
    "font-size": "var(--zode-font-size-13)",
    "font-weight": "600",
    "margin-bottom": "12px",
    "margin-top": "0",
    color: "var(--vscode-foreground)",
  } as const

  const labelStyle = {
    "font-size": "var(--zode-font-size-12)",
    color: "var(--vscode-descriptionForeground)",
    width: "100px",
  } as const

  const valueStyle = {
    "font-size": "var(--zode-font-size-12)",
    color: "var(--vscode-foreground)",
    "font-family": "var(--vscode-editor-font-family, monospace)",
  } as const

  return (
    <div>
      {/* Version Information */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.versionInfo")}</h4>
        <div style={{ display: "flex", "align-items": "center" }}>
          <span style={labelStyle}>{language.t("settings.aboutZodeCode.version.label")}</span>
          <span style={valueStyle}>{props.extensionVersion ?? "—"}</span>
        </div>
      </div>

      {/* Community & Support */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.community")}</h4>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: "0 0 12px 0",
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.feedback.prefix")}{" "}
          <span style={linkStyle} onClick={() => open("https://github.com/Zode-Org/zodecode")}>
            GitHub
          </span>
          ,{" "}
          <span style={linkStyle} onClick={() => open("https://reddit.com/r/zodecode")}>
            Reddit
          </span>
          , {language.t("settings.aboutZodeCode.feedback.or")}{" "}
          <span style={linkStyle} onClick={() => open("https://kilo.ai/discord")}>
            Discord
          </span>
          .
        </p>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: 0,
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.support.prefix")}{" "}
          <span style={linkStyle} onClick={() => open("https://kilo.ai/support")}>
            kilo.ai/support
          </span>
          .
        </p>
      </div>

      {/* Telemetry */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.telemetry.title")}</h4>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: "0 0 12px 0",
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.telemetry.description")}
        </p>
        <Button
          variant="secondary"
          size="small"
          onClick={() => vscode.postMessage({ type: "openVSCodeSettings", query: "telemetry.telemetryLevel" })}
        >
          <Icon name="settings-gear" />
          {language.t("settings.aboutZodeCode.telemetry.openSettings")}
        </Button>
      </div>

      {/* CLI Server */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.cliServer")}</h4>

        {/* Connection Status */}
        <div style={{ display: "flex", "align-items": "center", "margin-bottom": "12px" }}>
          <span style={labelStyle}>{language.t("settings.aboutZodeCode.status.label")}</span>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                "border-radius": "50%",
                background: getStatusColor(),
                display: "inline-block",
              }}
            />
            <span style={{ "font-size": "var(--zode-font-size-12)", color: "var(--vscode-foreground)" }}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Port Number */}
        <div style={{ display: "flex", "align-items": "center" }}>
          <span style={labelStyle}>{language.t("settings.aboutZodeCode.port.label")}</span>
          <span style={valueStyle}>{props.port !== null ? props.port : "—"}</span>
        </div>
      </div>

      {/* Settings Transfer */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.settingsTransfer.title")}</h4>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: "0 0 12px 0",
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.settingsTransfer.description")}
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="secondary" size="small" onClick={handleExport}>
            <Icon name="cloud-upload" />
            {language.t("settings.aboutZodeCode.exportSettings")}
          </Button>
          <Button variant="secondary" size="small" onClick={handleImport} disabled={importing()}>
            <Icon name="download" />
            {language.t("settings.aboutZodeCode.importSettings")}
          </Button>
        </div>
      </div>

      {/* legacy-migration start */}
      <div style={{ ...sectionStyle, "margin-bottom": "0" }}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.legacyMigration.title")}</h4>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: "0 0 12px 0",
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.legacyMigration.description")}
        </p>
        <button
          type="button"
          onClick={() => props.onMigrateClick?.()}
          style={{
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            padding: "6px 14px",
            "border-radius": "2px",
            cursor: "pointer",
            "font-size": "var(--zode-font-size-12)",
          }}
        >
          {language.t("settings.legacyMigration.link")}
        </button>
      </div>
      {/* legacy-migration end */}

      {/* Reset Settings */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{language.t("settings.aboutZodeCode.resetSettings.title")}</h4>
        <p
          style={{
            "font-size": "var(--zode-font-size-12)",
            color: "var(--vscode-descriptionForeground)",
            margin: "0 0 12px 0",
            "line-height": "1.5",
          }}
        >
          {language.t("settings.aboutZodeCode.resetSettings.description")}
        </p>
        <button
          type="button"
          onClick={() => vscode.postMessage({ type: "resetAllSettings" })}
          style={{
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            padding: "6px 14px",
            "border-radius": "2px",
            cursor: "pointer",
            "font-size": "var(--zode-font-size-12)",
          }}
        >
          {language.t("settings.aboutZodeCode.resetSettings.button")}
        </button>
      </div>
    </div>
  )
}

export default AboutZodeCodeTab
