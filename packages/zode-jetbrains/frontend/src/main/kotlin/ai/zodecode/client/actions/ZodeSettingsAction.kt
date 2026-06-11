package ai.zodecode.client.actions

import ai.zodecode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.ActionGroup
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.popup.JBPopupFactory

/**
 * Gear icon action placed in the Zode tool window title bar.
 *
 * Looks up [Zode.SettingsGroup] from [ActionManager] and shows it
 * as a popup. The group composition is declared in
 * `zode.jetbrains.frontend.xml`.
 */
class ZodeSettingsAction : AnAction() {

    companion object {
        const val GROUP_ID = "Zode.SettingsGroup"
    }

    override fun actionPerformed(e: AnActionEvent) {
        val component = e.inputEvent?.component ?: return
        val group = ActionManager.getInstance().getAction(GROUP_ID) as? ActionGroup ?: return
        Telemetry.send("Settings Opened", mapOf("surface" to "tool_window"))

        JBPopupFactory.getInstance()
            .createActionGroupPopup(
                null,
                group,
                e.dataContext,
                JBPopupFactory.ActionSelectionAid.SPEEDSEARCH,
                true,
            )
            .showUnderneathOf(component)
    }
}
