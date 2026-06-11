package ai.zodecode.client.session.ui.prompt

import com.intellij.openapi.actionSystem.DataKey

object PromptDataKeys {
    @JvmField
    val SEND: DataKey<SendPromptContext> =
        DataKey.create("ai.zodecode.client.session.ui.prompt.SendPromptContext")
}
