package ai.zodecode.backend.workspace

import ai.zodecode.backend.app.ZodeBackendAppService
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.coroutines.CoroutineScope

/**
 * Per-IntelliJ-Project adapter that maps [Project.getBasePath] to a
 * [ZodeBackendWorkspace] from the app-level workspace manager.
 *
 * This is a thin accessor — all data loading, SSE watching, session
 * access, and retry logic live in [ZodeBackendWorkspace]. The frontend
 * uses this service to get the workspace for the current IDE project.
 */
@Service(Service.Level.PROJECT)
class ZodeBackendProjectService(
    private val project: Project,
    @Suppress("unused") private val cs: CoroutineScope,
) {
    val directory: String get() = project.basePath ?: ""

    /** The workspace for this project's directory. */
    val workspace: ZodeBackendWorkspace
        get() = service<ZodeBackendAppService>().workspaces.get(directory)
}
