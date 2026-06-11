package ai.zodecode.client.actions

import ai.zodecode.client.app.ZodeAppService
import ai.zodecode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware

class ReinstallZodeAction : AnAction(), DumbAware {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("CLI Reinstall Clicked", mapOf("surface" to "settings"))
        service<ZodeAppService>().reinstallAsync()
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = true
    }
}
