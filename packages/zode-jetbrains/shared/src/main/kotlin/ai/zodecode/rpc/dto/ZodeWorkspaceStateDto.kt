package ai.zodecode.rpc.dto

import kotlinx.serialization.Serializable

@Serializable
enum class ZodeWorkspaceStatusDto {
    PENDING,
    LOADING,
    READY,
    ERROR,
}

@Serializable
data class ZodeWorkspaceLoadProgressDto(
    val providers: Boolean = false,
    val agents: Boolean = false,
    val commands: Boolean = false,
    val skills: Boolean = false,
)

@Serializable
data class ZodeWorkspaceStateDto(
    val status: ZodeWorkspaceStatusDto,
    val progress: ZodeWorkspaceLoadProgressDto? = null,
    val providers: ProvidersDto? = null,
    val agents: AgentsDto? = null,
    val commands: List<CommandDto> = emptyList(),
    val skills: List<SkillDto> = emptyList(),
    val error: String? = null,
    val errors: List<LoadErrorDto> = emptyList(),
)

@Serializable
data class ModelsWorkspaceDto(
    val providers: ProvidersDto? = null,
    val agents: AgentsDto? = null,
    val errors: List<LoadErrorDto> = emptyList(),
)
