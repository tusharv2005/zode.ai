@file:Suppress("UnstableApiUsage")

package ai.zodecode.backend.rpc

import ai.zodecode.backend.app.ZodeAppState
import ai.zodecode.backend.app.ZodeBackendAppService
import ai.zodecode.backend.telemetry.ZodeBackendTelemetry
import ai.zodecode.backend.app.ConfigWarning
import ai.zodecode.backend.app.LoadError
import ai.zodecode.backend.app.LoadProgress
import ai.zodecode.backend.app.ProfileResult
import ai.zodecode.jetbrains.api.model.AgentConfig
import ai.zodecode.jetbrains.api.model.Config
import ai.zodecode.jetbrains.api.model.ConfigAgent
import ai.zodecode.jetbrains.api.model.ZodeProfile200Response
import ai.zodecode.rpc.dto.AgentConfigDto
import ai.zodecode.rpc.dto.ConfigDto
import ai.zodecode.rpc.dto.ConfigPatchDto
import ai.zodecode.rpc.ZodeAppRpcApi
import ai.zodecode.rpc.dto.ConfigWarningDto
import ai.zodecode.rpc.dto.DeviceAuthDto
import ai.zodecode.rpc.dto.HealthDto
import ai.zodecode.rpc.dto.ZodeAppStateDto
import ai.zodecode.rpc.dto.ZodeAppStatusDto
import ai.zodecode.rpc.dto.LoadErrorDto
import ai.zodecode.rpc.dto.LoadProgressDto
import ai.zodecode.rpc.dto.ModelFavoriteUpdateDto
import ai.zodecode.rpc.dto.ModelSelectionUpdateDto
import ai.zodecode.rpc.dto.ModelStateDto
import ai.zodecode.rpc.dto.ModelVariantUpdateDto
import ai.zodecode.rpc.dto.ProfileBalanceDto
import ai.zodecode.rpc.dto.ProfileDto
import ai.zodecode.rpc.dto.ProfileOrganizationDto
import ai.zodecode.rpc.dto.ProfileStatusDto
import ai.zodecode.rpc.dto.TelemetryCaptureDto
import com.intellij.openapi.components.service
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

/**
 * Backend implementation of [ZodeAppRpcApi].
 *
 * Delegates directly to the app-level [ZodeBackendAppService] —
 * no project resolution needed since all operations are app-scoped.
 */
class ZodeAppRpcApiImpl : ZodeAppRpcApi {

    private val app: ZodeBackendAppService get() = service()

    override suspend fun connect() = app.connect()

    override suspend fun state(): Flow<ZodeAppStateDto> =
        app.appState.map(::dto).distinctUntilChanged()

    override suspend fun health(): HealthDto = app.health()

    override suspend fun retry() = app.retry()

    override suspend fun restart() = app.restart()

    override suspend fun reinstall() = app.reinstall()

    override suspend fun modelState(): ModelStateDto {
        app.requireReady()
        return app.models.state()
    }

    override suspend fun updateModelFavorite(update: ModelFavoriteUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.favorite(update)
    }

    override suspend fun updateModelSelection(update: ModelSelectionUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.selection(update)
    }

    override suspend fun clearModelSelection(agent: String): ModelStateDto {
        app.requireReady()
        return app.models.clear(agent)
    }

    override suspend fun updateModelVariant(update: ModelVariantUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.variant(update)
    }

    override suspend fun updateConfig(patch: ConfigPatchDto): ZodeAppStateDto {
        app.requireReady()
        return appStateDto(app.updateConfig(patch))
    }

    override suspend fun refreshProfile(): ProfileDto? = app.refreshProfile()?.let(::profileDto)

    override suspend fun startLogin(directory: String?): DeviceAuthDto = app.startLogin(directory)

    override suspend fun completeLogin(directory: String?): ProfileDto? = app.completeLogin(directory)?.let(::profileDto)

    override suspend fun logout(): Boolean = app.logout()

    override suspend fun setOrganization(organizationId: String?): ProfileDto? =
        app.setOrganization(organizationId)?.let(::profileDto)

    override suspend fun captureTelemetry(capture: TelemetryCaptureDto) {
        service<ZodeBackendTelemetry>().capture(app.http, app.port, capture.event, capture.properties)
    }

    private fun dto(state: ZodeAppState): ZodeAppStateDto =
        appStateDto(state)
}

internal fun appStateDto(state: ZodeAppState): ZodeAppStateDto =
    when (state) {
        ZodeAppState.Disconnected -> ZodeAppStateDto(ZodeAppStatusDto.DISCONNECTED)
        ZodeAppState.Connecting -> ZodeAppStateDto(ZodeAppStatusDto.CONNECTING)
        is ZodeAppState.Loading -> ZodeAppStateDto(
            status = ZodeAppStatusDto.LOADING,
            progress = progress(state.progress),
        )
        is ZodeAppState.MigrationRequired -> ZodeAppStateDto(
            status = ZodeAppStatusDto.MIGRATION_REQUIRED,
            migration = MigrationRpcMapper.toDto(state.detection),
        )
        is ZodeAppState.Ready -> ZodeAppStateDto(
            status = ZodeAppStatusDto.READY,
            progress = LoadProgressDto(
                config = true,
                notifications = true,
                profile = if (state.data.profile != null) ProfileStatusDto.LOADED
                    else ProfileStatusDto.NOT_LOGGED_IN,
            ),
            warnings = state.data.warnings.map(::warning),
            config = config(state.data.config),
            profile = state.data.profile?.let(::profileDto),
        )
        is ZodeAppState.Error -> ZodeAppStateDto(
            status = ZodeAppStatusDto.ERROR,
            error = state.message,
            errors = state.errors.map(::error),
        )
    }

internal fun profileDto(p: ZodeProfile200Response): ProfileDto = ProfileDto(
    email = p.profile.email,
    name = p.profile.name,
    organizations = p.profile.organizations.orEmpty().map { org ->
        ProfileOrganizationDto(id = org.id, name = org.name, role = org.role)
    },
    balance = p.balance?.let { ProfileBalanceDto(balance = it.balance) },
    currentOrgId = p.currentOrgId,
)

private fun progress(p: LoadProgress) = LoadProgressDto(
    config = p.config,
    notifications = p.notifications,
    profile = when (p.profile) {
        ProfileResult.PENDING -> ProfileStatusDto.PENDING
        ProfileResult.LOADED -> ProfileStatusDto.LOADED
        ProfileResult.NOT_LOGGED_IN -> ProfileStatusDto.NOT_LOGGED_IN
    },
)

private fun error(e: LoadError) = LoadErrorDto(
    resource = e.resource,
    status = e.status,
    detail = e.detail,
)

private fun warning(w: ConfigWarning) = ConfigWarningDto(
    path = w.path,
    message = w.message,
    detail = w.detail,
)

private fun config(c: Config) = ConfigDto(
    model = c.model,
    smallModel = c.smallModel,
    subagentModel = c.subagentModel,
    subagentVariant = c.subagentVariant,
    agent = agents(c.agent),
)

private fun agents(cfg: ConfigAgent?): Map<String, AgentConfigDto> {
    if (cfg == null) return emptyMap()
    val known = listOf(
        "plan" to cfg.plan,
        "build" to cfg.build,
        "debug" to cfg.debug,
        "orchestrator" to cfg.orchestrator,
        "ask" to cfg.ask,
        "general" to cfg.general,
        "explore" to cfg.explore,
        "title" to cfg.title,
        "summary" to cfg.summary,
        "compaction" to cfg.compaction,
    ).mapNotNull { (name, item) -> item?.let { name to agent(it) } }.toMap()
    val extra = cfg.entries.associate { (name, item) -> name to agent(item) }
    return known + extra
}

private fun agent(cfg: AgentConfig) = AgentConfigDto(
    model = cfg.model,
    variant = cfg.variant,
)
