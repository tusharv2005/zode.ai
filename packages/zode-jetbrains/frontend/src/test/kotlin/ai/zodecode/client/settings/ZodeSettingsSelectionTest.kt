package ai.zodecode.client.settings

import ai.zodecode.client.settings.models.ModelsConfigurable
import ai.zodecode.client.settings.profile.UserProfileConfigurable
import com.intellij.ide.util.PropertiesComponent
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class ZodeSettingsSelectionTest : BasePlatformTestCase() {

    override fun tearDown() {
        try {
            PropertiesComponent.getInstance(project).unsetValue(ZodeSettingsSelection.SELECTED_CONFIGURABLE_KEY)
        } finally {
            super.tearDown()
        }
    }

    fun `test falls back to profile when no last settings page exists`() {
        assertEquals(UserProfileConfigurable.ID, ZodeSettingsSelection.target(project))
    }

    fun `test falls back to profile when last page is not zode`() {
        select("preferences.lookFeel")

        assertEquals(UserProfileConfigurable.ID, ZodeSettingsSelection.target(project))
    }

    fun `test keeps last zode root page`() {
        select(ZodeSettingsConfigurable.ID)

        assertEquals(ZodeSettingsConfigurable.ID, ZodeSettingsSelection.target(project))
    }

    fun `test keeps last zode child page`() {
        select(ModelsConfigurable.ID)

        assertEquals(ModelsConfigurable.ID, ZodeSettingsSelection.target(project))
    }

    private fun select(id: String) {
        PropertiesComponent.getInstance(project).setValue(ZodeSettingsSelection.SELECTED_CONFIGURABLE_KEY, id)
    }
}
