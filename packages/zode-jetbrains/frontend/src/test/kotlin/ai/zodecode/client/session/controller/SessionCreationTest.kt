package ai.zodecode.client.session.controller

import ai.zodecode.rpc.dto.ConfigDto
import ai.zodecode.rpc.dto.ZodeAppStateDto
import ai.zodecode.rpc.dto.ZodeAppStatusDto
import ai.zodecode.rpc.dto.ModelDto
import ai.zodecode.rpc.dto.ModelStateDto
import ai.zodecode.rpc.dto.ProviderDto

class SessionCreationTest : SessionControllerTestBase() {

    fun `test prompt creates session on first call`() {
        val m = controller()
        val events = collect(m)
        flush()
        events.clear()

        edt { m.prompt("hello") }
        flush()

        assertEquals(1, rpc.creates)
        assertEquals(1, rpc.prompts.size)
        assertEquals("ses_test", rpc.prompts[0].first)
        assertControllerEvents("ViewChanged session", events)
        assertSession(
            """
            [app: DISCONNECTED] [workspace: PENDING]
            """,
            m,
        )
    }

    fun `test prompt reuses existing session`() {
        val m = controller()

        edt { m.prompt("first") }
        flush()
        edt { m.prompt("second") }
        flush()

        assertEquals(1, rpc.creates)
        assertEquals(2, rpc.prompts.size)
        assertEquals("ses_test", rpc.prompts[1].first)
    }

    fun `test prompt with existing ID skips creation`() {
        val m = controller("existing")
        collect(m)
        flush()

        edt { m.prompt("hello") }
        flush()

        assertEquals(0, rpc.creates)
        assertEquals(1, rpc.prompts.size)
        assertEquals("existing", rpc.prompts[0].first)
    }

    fun `test prompt sends selected model agent and variant`() {
        appRpc.models = ModelStateDto(variant = mapOf("zode/gpt-5" to "medium"))
        appRpc.state.value = ZodeAppStateDto(ZodeAppStatusDto.READY, config = ConfigDto(model = "zode/gpt-5"))
        projectRpc.state.value = workspaceReady(
            providers = listOf(
                ProviderDto(
                    id = "zode",
                    name = "Zode",
                    models = mapOf(
                        "gpt-5" to ModelDto(id = "gpt-5", name = "GPT-5", variants = listOf("low", "medium", "high")),
                    ),
                ),
            ),
        )
        val m = controller("existing")
        collect(m)
        flush()

        edt { m.prompt("hello") }
        flush()

        val prompt = rpc.prompts.single().third
        assertEquals("zode", prompt.providerID)
        assertEquals("gpt-5", prompt.modelID)
        assertEquals("code", prompt.agent)
        assertEquals("medium", prompt.variant)
    }
}
