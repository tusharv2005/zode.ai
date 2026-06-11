declare global {
  const ZODE_VERSION: string
  const ZODE_CHANNEL: string
  const ZODE_BUILD_KIND: string // zodecode_change
}

export const InstallationVersion = typeof ZODE_VERSION === "string" ? ZODE_VERSION : "local"
export const InstallationChannel = typeof ZODE_CHANNEL === "string" ? ZODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
// zodecode_change start - distinguish release builds from source / local builds
export const InstallationBuildKind: "source" | "release" =
  typeof ZODE_BUILD_KIND === "string" && ZODE_BUILD_KIND === "release" ? "release" : "source"
// zodecode_change end
