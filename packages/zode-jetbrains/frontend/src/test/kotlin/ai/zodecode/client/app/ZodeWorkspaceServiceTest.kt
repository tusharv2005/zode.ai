package ai.zodecode.client.app

import ai.zodecode.client.testing.FakeWorkspaceRpcApi
import ai.zodecode.rpc.dto.WorkspaceFileDto
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

@Suppress("UnstableApiUsage")
class ZodeWorkspaceServiceTest : BasePlatformTestCase() {
    private lateinit var scope: CoroutineScope
    private lateinit var rpc: FakeWorkspaceRpcApi
    private lateinit var service: ZodeWorkspaceService

    override fun setUp() {
        super.setUp()
        scope = CoroutineScope(SupervisorJob())
        rpc = FakeWorkspaceRpcApi()
        service = ZodeWorkspaceService(scope, rpc)
    }

    override fun tearDown() {
        try {
            scope.cancel()
        } finally {
            super.tearDown()
        }
    }

    fun `test openPath opens first file match`() = runBlocking {
        rpc.fileMatches = listOf(
            WorkspaceFileDto("/test/.zode/plans/a.md", "a.md"),
            WorkspaceFileDto("/other/.zode/plans/a.md", "a.md"),
        )

        val ok = withContext(Dispatchers.Default) {
            service.openPath("/test", ".zode/plans/a.md")
        }

        assertTrue(ok)
        assertEquals(listOf("/test" to ".zode/plans/a.md"), rpc.fileCalls)
        assertEquals(listOf("/test/.zode/plans/a.md"), rpc.opened)
    }

    fun `test openPath returns false when no match exists`() = runBlocking {
        val ok = withContext(Dispatchers.Default) {
            service.openPath("/test", ".zode/plans/missing.md")
        }

        assertFalse(ok)
        assertEquals(listOf("/test" to ".zode/plans/missing.md"), rpc.fileCalls)
        assertTrue(rpc.opened.isEmpty())
    }

    fun `test openPath returns false when backend open fails`() = runBlocking {
        rpc.fileMatches = listOf(WorkspaceFileDto("/test/.zode/plans/a.md", "a.md"))
        rpc.openResult = false

        val ok = withContext(Dispatchers.Default) {
            service.openPath("/test", ".zode/plans/a.md")
        }

        assertFalse(ok)
        assertEquals(listOf("/test/.zode/plans/a.md"), rpc.opened)
    }
}
