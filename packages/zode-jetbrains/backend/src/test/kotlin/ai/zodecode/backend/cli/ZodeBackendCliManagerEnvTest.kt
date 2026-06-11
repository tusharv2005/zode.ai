package ai.zodecode.backend.cli

import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import java.io.File
import java.nio.file.Files

class ZodeBackendCliManagerEnvTest {

    private lateinit var tmp: File
    private val manager = ZodeBackendCliManager()

    @BeforeTest
    fun setUp() {
        tmp = Files.createTempDirectory("zode-cli-env-test").toFile()
        System.clearProperty("zode.dev.storage.isolated")
        System.clearProperty("zode.dev.worktree.root")
        System.clearProperty("idea.plugin.in.sandbox.mode")
    }

    @AfterTest
    fun tearDown() {
        System.clearProperty("zode.dev.storage.isolated")
        System.clearProperty("zode.dev.worktree.root")
        System.clearProperty("idea.plugin.in.sandbox.mode")
        tmp.deleteRecursively()
    }

    @Test
    fun `isolation disabled - required JetBrains env vars are present`() {
        val env = manager.buildEnv("pwd123", emptyMap())

        assertEquals("jetbrains", env["ZODE_CLIENT"])
        assertEquals("true", env["ZODE_ENABLE_QUESTION_TOOL"])
        assertEquals("jetbrains", env["ZODE_PLATFORM"])
        assertEquals("zode-code", env["ZODE_APP_NAME"])
        assertEquals("all", env["ZODE_TELEMETRY_LEVEL"])
        assertEquals("true", env["ZODE_DISABLE_CLAUDE_CODE"])
        assertEquals("jetbrains-plugin", env["ZODECODE_FEATURE"])
        assertEquals("pwd123", env["ZODE_SERVER_PASSWORD"])
    }

    @Test
    fun `dev mode disables CLI telemetry`() {
        System.setProperty("idea.plugin.in.sandbox.mode", "true")

        val env = manager.buildEnv("pwd123", emptyMap())

        assertEquals("off", env["ZODE_TELEMETRY_LEVEL"])
    }

    @Test
    fun `isolation disabled - default CLI config asks for edit and bash permissions`() {
        val env = manager.buildEnv("pwd123", emptyMap())

        assertEquals("""{"permission":{"edit":"ask","bash":"ask"}}""", env["ZODE_CONFIG_CONTENT"])
    }

    @Test
    fun `isolation disabled - base CLI config is preserved`() {
        val cfg = """{"permission":{"edit":"allow"}}"""

        val env = manager.buildEnv("pwd123", mapOf("ZODE_CONFIG_CONTENT" to cfg))

        assertEquals(cfg, env["ZODE_CONFIG_CONTENT"])
    }

    @Test
    fun `isolation disabled - no XDG storage overrides are injected`() {
        val env = manager.buildEnv("pwd123", emptyMap())

        assertFalse(env.containsKey("XDG_DATA_HOME"), "XDG_DATA_HOME should not be set when isolation is off")
        assertFalse(env.containsKey("XDG_CONFIG_HOME"), "XDG_CONFIG_HOME should not be set when isolation is off")
        assertFalse(env.containsKey("XDG_STATE_HOME"), "XDG_STATE_HOME should not be set when isolation is off")
        assertFalse(env.containsKey("XDG_CACHE_HOME"), "XDG_CACHE_HOME should not be set when isolation is off")
    }

    @Test
    fun `isolation enabled - XDG vars point under zode-dev in worktree root`() {
        System.setProperty("zode.dev.storage.isolated", "true")
        System.setProperty("zode.dev.worktree.root", tmp.absolutePath)

        val env = manager.buildEnv("pwd123", emptyMap())

        val dev = File(tmp, ".zode-dev")
        assertEquals(File(dev, "data").absolutePath, env["XDG_DATA_HOME"])
        assertEquals(File(dev, "config").absolutePath, env["XDG_CONFIG_HOME"])
        assertEquals(File(dev, "state").absolutePath, env["XDG_STATE_HOME"])
        assertEquals(File(dev, "cache").absolutePath, env["XDG_CACHE_HOME"])
    }

    @Test
    fun `isolation enabled - zode-dev subdirectories are created`() {
        System.setProperty("zode.dev.storage.isolated", "true")
        System.setProperty("zode.dev.worktree.root", tmp.absolutePath)

        manager.buildEnv("pwd123", emptyMap())

        val dev = File(tmp, ".zode-dev")
        assertTrue(File(dev, "data").isDirectory, "data dir should be created")
        assertTrue(File(dev, "config").isDirectory, "config dir should be created")
        assertTrue(File(dev, "state").isDirectory, "state dir should be created")
        assertTrue(File(dev, "cache").isDirectory, "cache dir should be created")
    }

    @Test
    fun `isolation enabled - required JetBrains env vars are still present`() {
        System.setProperty("zode.dev.storage.isolated", "true")
        System.setProperty("zode.dev.worktree.root", tmp.absolutePath)

        val env = manager.buildEnv("pwd123", emptyMap())

        assertEquals("jetbrains", env["ZODE_CLIENT"])
        assertEquals("pwd123", env["ZODE_SERVER_PASSWORD"])
        assertEquals("jetbrains-plugin", env["ZODECODE_FEATURE"])
    }

    @Test
    fun `isolation enabled - base env vars are preserved`() {
        System.setProperty("zode.dev.storage.isolated", "true")
        System.setProperty("zode.dev.worktree.root", tmp.absolutePath)

        val env = manager.buildEnv("pwd123", mapOf("MY_CUSTOM_VAR" to "hello"))

        assertEquals("hello", env["MY_CUSTOM_VAR"])
    }

    @Test
    fun `isolation enabled without worktree root - no XDG vars are injected`() {
        System.setProperty("zode.dev.storage.isolated", "true")
        // zode.dev.worktree.root is intentionally not set

        val env = manager.buildEnv("pwd123", emptyMap())

        assertFalse(env.containsKey("XDG_DATA_HOME"), "XDG_DATA_HOME should not be set when root is missing")
        assertFalse(env.containsKey("XDG_CONFIG_HOME"), "XDG_CONFIG_HOME should not be set when root is missing")
        assertFalse(env.containsKey("XDG_STATE_HOME"), "XDG_STATE_HOME should not be set when root is missing")
        assertFalse(env.containsKey("XDG_CACHE_HOME"), "XDG_CACHE_HOME should not be set when root is missing")
    }
}
