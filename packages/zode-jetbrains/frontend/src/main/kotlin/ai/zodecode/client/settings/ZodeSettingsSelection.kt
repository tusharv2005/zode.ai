package ai.zodecode.client.settings

import ai.zodecode.client.settings.profile.UserProfileConfigurable
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.project.Project

internal object ZodeSettingsSelection {
    // IntelliJ persists the selected settings page with SettingsEditor.SELECTED_CONFIGURABLE.
    const val SELECTED_CONFIGURABLE_KEY = "settings.editor.selected.configurable"

    fun target(project: Project): String {
        val id = PropertiesComponent.getInstance(project).getValue(SELECTED_CONFIGURABLE_KEY)
        if (id != null && isZode(id)) return id
        return UserProfileConfigurable.ID
    }

    private fun isZode(id: String?): Boolean {
        if (id == ZodeSettingsConfigurable.ID) return true
        return id?.startsWith("${ZodeSettingsConfigurable.ID}.") == true
    }
}
