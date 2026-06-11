package ai.zodecode.client.actions

import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.session.SessionManager
import ai.zodecode.client.telemetry.Telemetry
import com.intellij.icons.AllIcons
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAware

class HistoryAction : AnAction(
    ZodeBundle.message("action.Zode.History.text"),
    ZodeBundle.message("action.Zode.History.description"),
    AllIcons.Vcs.History,
), DumbAware {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("History Opened", mapOf("surface" to "tool_window"))
        e.getData(SessionManager.KEY)?.showHistory()
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.getData(SessionManager.KEY) != null
    }
}
