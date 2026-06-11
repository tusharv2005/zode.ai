package ai.zodecode.client.session.ui.prompt

import ai.zodecode.client.session.ui.editor.SessionEditorTextField
import com.intellij.openapi.project.Project

internal class PromptEditorTextField(
    project: Project,
    ctx: SendPromptContext,
) : SessionEditorTextField(project, ctx)
