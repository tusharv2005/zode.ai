package ai.zodecode.client.session

import ai.zodecode.client.app.ZodeAppService
import ai.zodecode.client.app.ZodeSessionService
import ai.zodecode.client.app.Workspace
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob

@Service(Service.Level.APP)
class SessionUiFactory(
    private val cs: CoroutineScope,
) {
    fun create(
        project: Project,
        workspace: Workspace,
        manager: SessionManager,
        ref: SessionRef? = null,
    ): SessionUi = SessionUi(
        project = project,
        workspace = workspace,
        sessions = project.service<ZodeSessionService>(),
        app = service<ZodeAppService>(),
        cs = scope(),
        ref = ref,
        manager = manager,
    )

    fun scope(): CoroutineScope {
        val parent = cs.coroutineContext[Job]
        return CoroutineScope(cs.coroutineContext + SupervisorJob(parent))
    }
}
