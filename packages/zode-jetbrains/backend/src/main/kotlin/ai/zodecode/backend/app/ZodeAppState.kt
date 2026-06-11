package ai.zodecode.backend.app

import ai.zodecode.jetbrains.api.model.Config
import ai.zodecode.jetbrains.api.model.ZodeNotifications200ResponseInner
import ai.zodecode.jetbrains.api.model.ZodeProfile200Response
import ai.zodecode.backend.migration.LegacyMigrationDetection

/**
 * Full application lifecycle state, combining CLI transport connection
 * status with data-loading progress.
 *
 * [ConnectionState] stays internal to [ZodeConnectionService] for the
 * transport layer. This sealed class is what the frontend observes.
 */
sealed class ZodeAppState {
    data object Disconnected : ZodeAppState()
    data object Connecting : ZodeAppState()
    data class Loading(val progress: LoadProgress) : ZodeAppState()
    data class MigrationRequired(val detection: LegacyMigrationDetection) : ZodeAppState()
    data class Ready(val data: AppData) : ZodeAppState()
    data class Error(val message: String, val errors: List<LoadError> = emptyList()) : ZodeAppState()
}

/**
 * Tracks which global data fetches have completed during the [ZodeAppState.Loading] phase.
 */
data class LoadProgress(
    val config: Boolean = false,
    val notifications: Boolean = false,
    val profile: ProfileResult = ProfileResult.PENDING,
)

/** Outcome of the profile fetch. */
enum class ProfileResult { PENDING, LOADED, NOT_LOGGED_IN }

/**
 * Error detail for a single resource that failed to load.
 */
data class LoadError(
    val resource: String,
    val status: Int? = null,
    val detail: String? = null,
)

data class ConfigWarning(
    val path: String,
    val message: String,
    val detail: String? = null,
)

/**
 * All global data that has been successfully loaded.
 * Present only in [ZodeAppState.Ready].
 */
data class AppData(
    val profile: ZodeProfile200Response?,
    val config: Config,
    val notifications: List<ZodeNotifications200ResponseInner>,
    val warnings: List<ConfigWarning> = emptyList(),
)
