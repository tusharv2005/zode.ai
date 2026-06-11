package ai.zodecode.client.actions

import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.session.ui.prompt.PromptDataKeys
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAwareAction

class StopSessionAction : DumbAwareAction(
    ZodeBundle.message("action.Zode.StopSession.text"),
    ZodeBundle.message("action.Zode.StopSession.description"),
    null,
) {
    companion object {
        const val ID = "Zode.StopSession"
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.EDT

    override fun update(e: AnActionEvent) {
        val ctx = e.getData(PromptDataKeys.SEND)
        e.presentation.isEnabled = ctx != null && ctx.isStopEnabled
    }

    override fun actionPerformed(e: AnActionEvent) {
        val ctx = e.getData(PromptDataKeys.SEND) ?: return
        if (!ctx.isStopEnabled) return
        ctx.stop()
    }
}
