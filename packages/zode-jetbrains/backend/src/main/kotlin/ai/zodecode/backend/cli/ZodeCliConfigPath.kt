package ai.zodecode.backend.cli

import com.intellij.openapi.util.SystemInfo
import java.io.File

internal object ZodeCliConfigPath {
    fun resolve(env: Map<String, String>): File {
        env["ZODE_CONFIG_DIR"]?.takeIf { it.isNotBlank() }?.let { return File(it) }
        env["XDG_CONFIG_HOME"]?.takeIf { it.isNotBlank() }?.let { return File(it, "zode") }
        return File(defaultRoot(), "zode")
    }

    fun legacySettingsFile(env: Map<String, String>): File = File(resolve(env), "legacy-settings.json")

    private fun defaultRoot(): File {
        if (SystemInfo.isWindows) {
            val app = System.getenv("APPDATA")?.takeIf { it.isNotBlank() }
            if (app != null) return File(app)
        }
        if (SystemInfo.isMac) return File(System.getProperty("user.home"), "Library/Application Support")
        return File(System.getProperty("user.home"), ".config")
    }
}
