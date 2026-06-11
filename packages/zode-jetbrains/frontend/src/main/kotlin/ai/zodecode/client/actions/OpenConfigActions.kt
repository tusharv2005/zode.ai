package ai.zodecode.client.actions

import ai.zodecode.client.ZodeNotifications
import ai.zodecode.client.app.ZodeWorkspaceService
import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.session.SessionManager
import ai.zodecode.client.telemetry.Telemetry
import ai.zodecode.rpc.dto.ConfigTargetDto
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware

abstract class ConfigAction(
    private val open: String,
    private val create: String,
    text: String,
    description: String,
) : AnAction(text, description, null), DumbAware {
    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    protected fun text(target: ConfigTargetDto?): String {
        val key = if (target?.exists == false) create else open
        return ZodeBundle.message(key, target?.displayPath ?: "...")
    }

    protected fun failed() {
        ZodeNotifications.error(ZodeBundle.message("action.Zode.OpenConfig.failed"))
    }
}

class OpenLocalConfigAction : ConfigAction(
    open = "action.Zode.OpenLocalConfig.text",
    create = "action.Zode.CreateLocalConfig.text",
    text = ZodeBundle.message("action.Zode.OpenLocalConfig.text", "..."),
    description = ZodeBundle.message("action.Zode.OpenLocalConfig.description"),
) {
    override fun update(e: AnActionEvent) {
        val dir = directory(e)
        e.presentation.isEnabled = dir != null
        e.presentation.text = text(dir?.let { service<ZodeWorkspaceService>().localConfig[it] })
    }

    override fun actionPerformed(e: AnActionEvent) {
        val dir = directory(e) ?: return
        Telemetry.send("Config Opened", mapOf("surface" to "tool_window", "scope" to "local"))
        service<ZodeWorkspaceService>().openLocalConfig(dir) { ok ->
            if (!ok) failed()
        }
    }

    private fun directory(e: AnActionEvent): String? {
        return e.getData(SessionManager.WORKSPACE_KEY)?.directory ?: e.project?.basePath
    }
}

class OpenGlobalConfigAction : ConfigAction(
    open = "action.Zode.OpenGlobalConfig.text",
    create = "action.Zode.CreateGlobalConfig.text",
    text = ZodeBundle.message("action.Zode.OpenGlobalConfig.text", "..."),
    description = ZodeBundle.message("action.Zode.OpenGlobalConfig.description"),
) {
    override fun update(e: AnActionEvent) {
        e.presentation.text = text(service<ZodeWorkspaceService>().globalConfig)
    }

    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("Config Opened", mapOf("surface" to "tool_window", "scope" to "global"))
        service<ZodeWorkspaceService>().openGlobalConfig { ok ->
            if (!ok) failed()
        }
    }
}
