package ai.zodecode.client.session

import ai.zodecode.client.plugin.ZodeBundle
import ai.zodecode.client.ui.UiStyle
import java.awt.Color

enum class SessionActivityKind {
    RUNNING,
    LOGIN_REQUIRED,
    PERMISSION,
    PLAN,
    QUESTION,
    ;

    fun label(): String = when (this) {
        RUNNING -> ZodeBundle.message("session.part.tool.running")
        LOGIN_REQUIRED -> ZodeBundle.message("history.badge.loginRequired")
        PERMISSION -> ZodeBundle.message("history.badge.permission")
        PLAN -> ZodeBundle.message("history.badge.plan")
        QUESTION -> ZodeBundle.message("history.badge.question")
    }

    fun bg(): Color = when (this) {
        RUNNING -> UiStyle.Colors.runningBadgeBg()
        LOGIN_REQUIRED, PERMISSION, PLAN, QUESTION -> UiStyle.Colors.activityBadgeBg()
    }

    fun fg(): Color = when (this) {
        RUNNING -> UiStyle.Colors.runningBadgeFg()
        LOGIN_REQUIRED, PERMISSION, PLAN, QUESTION -> UiStyle.Colors.activityBadgeFg()
    }
}
