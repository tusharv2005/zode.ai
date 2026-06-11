package ai.zodecode.client.session.views.base

import ai.zodecode.client.session.model.Content
import ai.zodecode.client.session.ui.style.SessionEditorStyle
import ai.zodecode.client.session.ui.style.SessionEditorStyleTarget
import com.intellij.openapi.Disposable
import javax.swing.JPanel

/**
 * Base class for all part renderers.
 *
 * Each subclass wraps one [Content] subtype and knows how to display
 * and update it. Subclasses extend [JPanel] so they can be added directly
 * to [ai.zodecode.client.session.views.MessageView] without an extra component wrapper.
 *
 * All methods must be called on the EDT.
 */
abstract class PartView : JPanel(), Disposable, SessionEditorStyleTarget {

    /** Stable [Content.id] this renderer was created for. */
    abstract val contentId: String

    /**
     * Apply a full content update — replace, not append.
     * Called when [ai.zodecode.client.session.model.SessionModelEvent.ContentUpdated] fires.
     */
    abstract fun update(content: Content)

    /**
     * Append a streaming delta to the existing content.
     * Only meaningful for text-bearing renderers ([ai.zodecode.client.session.views.TextView],
     * [ai.zodecode.client.session.views.ReasoningView]); others ignore deltas by default.
     */
    open fun appendDelta(delta: String) {}

    override fun applyStyle(style: SessionEditorStyle) {}

    override fun dispose() {}

    /** Readable name for test dumps. */
    open fun dumpLabel(): String = javaClass.simpleName
}
