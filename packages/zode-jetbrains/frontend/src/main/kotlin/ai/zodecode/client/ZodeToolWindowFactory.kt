package ai.zodecode.client

import ai.zodecode.client.app.ZodeWorkspaceService
import ai.zodecode.client.app.Workspace
import ai.zodecode.client.session.SessionSidePanelManager
import ai.zodecode.client.telemetry.Telemetry
import ai.zodecode.log.ZodeLog
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Creates the Zode Code tool window and delegates session content management.
 *
 * Resolves the project directory through the backend (handles split-mode
 * where `project.basePath` is a synthetic frontend path) before creating
 * the workspace. The tool window shows a loading state until resolution
 * completes.
 */
class ZodeToolWindowFactory : ToolWindowFactory, DumbAware {

    companion object {
        private val LOG = ZodeLog.create(ZodeToolWindowFactory::class.java)
    }

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val start = System.currentTimeMillis()
        try {
            val workspaces = service<ZodeWorkspaceService>()
            val cs = CoroutineScope(SupervisorJob())
            val hint = project.basePath ?: ""

            cs.launch {
                val dir = workspaces.resolveProjectDirectory(hint)
                val workspace = workspaces.workspace(dir)
                withContext(Dispatchers.Main) {
                    setup(project, toolWindow, workspace)
                }
                Telemetry.send("Tool Window Opened", mapOf(
                    "projectResolved" to dir.isNotBlank().toString(),
                    "durationMs" to (System.currentTimeMillis() - start).toString(),
                ))
            }
        } catch (e: Exception) {
            Telemetry.send("Tool Window Setup Failed", mapOf("stage" to "create", "errorClass" to e::class.java.name))
            LOG.error("Failed to create Zode tool window content", e)
        }
    }

    private fun setup(
        project: Project,
        toolWindow: ToolWindow,
        workspace: Workspace,
    ) {
        try {
            val manager = SessionSidePanelManager(project, workspace)
            val content = ContentFactory.getInstance().createContent(manager.component, "", false)
            content.setDisposer(manager)
            content.setPreferredFocusedComponent { manager.defaultFocusedComponent }
            toolWindow.contentManager.addContent(content)
            toolWindow.contentManager.setSelectedContent(content)
            manager.newSession()

            val actions = listOfNotNull(
                ActionManager.getInstance().getAction("Zode.NewSession"),
                ActionManager.getInstance().getAction("Zode.History"),
                ActionManager.getInstance().getAction("Zode.Settings"),
            )
            toolWindow.setTitleActions(actions)
        } catch (e: Exception) {
            Telemetry.send("Tool Window Setup Failed", mapOf("stage" to "setup", "errorClass" to e::class.java.name))
            LOG.error("Failed to set up Zode tool window content", e)
        }
    }
}
