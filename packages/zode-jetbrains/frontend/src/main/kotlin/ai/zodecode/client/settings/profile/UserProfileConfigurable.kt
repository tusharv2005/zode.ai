package ai.zodecode.client.settings.profile

import ai.zodecode.client.app.ZodeAppService
import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.settings.base.SettingsPanel
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.ModalityState
import com.intellij.openapi.components.service
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.options.SearchableConfigurable
import com.intellij.openapi.wm.IdeFocusManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.swing.JComponent

/**
 * Settings panel for Zode user profile.
 *
 * Located at Settings -> Tools -> Zode -> User Profile.
 *
 * Shows login / logout, current balance, personal/org account selector,
 * and a link to the Zode dashboard. This is a status/action panel — it
 * has no persistent settings, so [isModified] always returns false.
 */
class UserProfileConfigurable : SearchableConfigurable, Configurable.NoScroll {

    private var ui: ProfileUi? = null
    private var shell: SettingsPanel? = null
    private var scope: CoroutineScope? = null
    private var watchJob: Job? = null
    private var focus = false

    override fun getId(): String = ID

    override fun getDisplayName(): String = ZodeBundle.message("settings.profile.displayName")

    override fun getPreferredFocusedComponent(): JComponent? = ui?.preferredFocus()

    override fun focusOn(label: String) {
        if (label != FOCUS_ACCOUNT_COMBO) return
        focus = true
        val panel = ui ?: return
        requestFocus(panel)
    }

    override fun createComponent(): JComponent {
        val cs = CoroutineScope(SupervisorJob() + Dispatchers.Default)
        scope = cs
        val panel = buildPanel(cs)
        val root = SettingsPanel()
        root.setContent(panel)
        ui = panel
        shell = root
        startWatching(cs, panel)
        if (focus) requestFocus(panel)
        return root
    }

    private fun requestFocus(panel: ProfileUi) {
        val app = ApplicationManager.getApplication()
        app.invokeLater({
            app.invokeLater({
                val target = panel.preferredFocus()
                if (target.isShowing) IdeFocusManager.getGlobalInstance().requestFocus(target, true)
            }, ModalityState.any())
        }, ModalityState.any())
    }

    private fun buildPanel(cs: CoroutineScope): ProfileUi {
        val app = service<ZodeAppService>()
        return ProfileUi(app.state.value.profile, app.state.value.status, cs)
    }

    private fun startWatching(cs: CoroutineScope, panel: ProfileUi) {
        val app = service<ZodeAppService>()
        watchJob = cs.launch {
            app.state.collect { state ->
                withContext(edt) {
                    panel.update(state)
                }
            }
        }
        cs.launch {
            app.connect()
        }
    }

    override fun isModified(): Boolean = false

    override fun apply() = Unit

    override fun reset() = Unit

    override fun disposeUIResources() {
        // Dispose UI first to invalidate pending login attempts before scope cancellation.
        // Capturing local refs before nulling fields so the EDT callback is self-contained.
        val panel = ui
        val job = watchJob
        val cs = scope
        ui = null
        shell = null
        watchJob = null
        scope = null

        val app = ApplicationManager.getApplication()
        if (panel != null) {
            if (app.isDispatchThread) {
                panel.dispose()
                job?.cancel()
                cs?.cancel()
            } else {
                // Schedule on EDT so dispose runs before scope cancel, as the plan requires.
                app.invokeLater({
                    panel.dispose()
                    job?.cancel()
                    cs?.cancel()
                }, ModalityState.any())
            }
        } else {
            job?.cancel()
            cs?.cancel()
        }
    }

    companion object {
        const val ID = "ai.zodecode.jetbrains.settings.profile"
        const val FOCUS_ACCOUNT_COMBO = "zode.profile.account.combo"
    }
}
