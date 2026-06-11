package ai.zodecode.client

import com.intellij.notification.Notification
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.ProjectManager

object ZodeNotifications {
    private const val GROUP = "Zode Code"

    fun error(title: String, content: String? = null) {
        val project = ProjectManager.getInstance().openProjects.firstOrNull { !it.isDefault }
        val notification = NotificationGroupManager.getInstance()
            .getNotificationGroup(GROUP)
            ?.createNotification(title, content ?: "", NotificationType.ERROR)
            ?: Notification(GROUP, title, content ?: "", NotificationType.ERROR)
        notification.notify(project)
    }
}
