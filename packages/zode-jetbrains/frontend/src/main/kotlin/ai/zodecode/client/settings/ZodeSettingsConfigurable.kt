package ai.zodecode.client.settings

import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.settings.models.ModelsConfigurable
import ai.zodecode.client.settings.profile.UserProfileConfigurable
import ai.zodecode.client.ui.layout.Stack
import com.intellij.ide.DataManager
import com.intellij.openapi.options.SearchableConfigurable
import com.intellij.openapi.options.ex.Settings
import com.intellij.ui.components.ActionLink
import com.intellij.ui.components.JBLabel
import com.intellij.util.ui.JBUI
import javax.swing.JComponent

/**
 * Root settings entry under Settings -> Tools -> Zode Code.
 *
 * Displays a brief description and a link to the User Profile child page.
 * Child configurables are registered in XML (`zode.jetbrains.frontend.xml`) as
 * `applicationConfigurable` entries with the appropriate `parentId` — that is the
 * single source of truth for the settings hierarchy. This class does NOT implement
 * [com.intellij.openapi.options.SearchableConfigurable.Parent] to avoid creating a
 * second `UserProfileConfigurable` instance alongside the one registered in XML.
 *
 * The link uses [UserProfileConfigurable.ID] to navigate via [Settings.find]/[Settings.select].
 */
class ZodeSettingsConfigurable : SearchableConfigurable {

    override fun getId(): String = ID

    override fun getDisplayName(): String = ZodeBundle.message("settings.zode.displayName")

    override fun createComponent(): JComponent {
        val panel = Stack.vertical()
        panel.border = JBUI.Borders.empty(8, 0, 0, 0)

        val desc = JBLabel(ZodeBundle.message("settings.zode.description"))
        desc.border = JBUI.Borders.emptyBottom(12)
        panel.next(desc)

        val link = ActionLink(ZodeBundle.message("settings.profile.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, UserProfileConfigurable.ID)
        }
        link.border = JBUI.Borders.emptyBottom(4)
        panel.next(link)

        val models = ActionLink(ZodeBundle.message("settings.models.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, ModelsConfigurable.ID)
        }
        models.border = JBUI.Borders.emptyBottom(4)
        panel.next(models)

        return panel
    }

    override fun isModified(): Boolean = false

    override fun apply() = Unit

    internal fun open(settings: Settings, id: String = UserProfileConfigurable.ID) {
        settings.find(id)?.let { settings.select(it) }
    }

    companion object {
        const val ID = "ai.zodecode.jetbrains.settings"
    }
}
