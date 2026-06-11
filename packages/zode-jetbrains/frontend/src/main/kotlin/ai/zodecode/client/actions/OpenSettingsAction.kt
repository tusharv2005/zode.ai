package ai.zodecode.client.actions

import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.settings.ZodeSettingsSelection
import ai.zodecode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.options.ConfigurableWithId
import com.intellij.openapi.options.ShowSettingsUtil
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.ProjectManager
import java.util.function.Predicate

class OpenSettingsAction : DumbAwareAction(
    ZodeBundle.message("action.Zode.OpenSettings.text"),
    ZodeBundle.message("action.Zode.OpenSettings.description"),
    null,
) {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("Settings Opened", mapOf("surface" to "tool_window"))
        val project = e.project ?: ProjectManager.getInstance().defaultProject
        val target = ZodeSettingsSelection.target(project)
        ShowSettingsUtil.getInstance().showSettingsDialog(
            project,
            Predicate { cfg: Configurable ->
                cfg is ConfigurableWithId && cfg.getId() == target
            },
            null,
        )
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT
}
