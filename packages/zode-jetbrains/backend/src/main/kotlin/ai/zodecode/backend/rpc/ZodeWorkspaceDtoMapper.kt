package ai.zodecode.backend.rpc

import ai.zodecode.backend.app.LoadError
import ai.zodecode.backend.workspace.AgentData
import ai.zodecode.backend.workspace.AgentInfo
import ai.zodecode.backend.workspace.CommandInfo
import ai.zodecode.backend.workspace.ZodeWorkspaceLoadProgress
import ai.zodecode.backend.workspace.ModelInfo
import ai.zodecode.backend.workspace.ProviderData
import ai.zodecode.backend.workspace.ProviderInfo
import ai.zodecode.backend.workspace.SkillInfo
import ai.zodecode.rpc.dto.AgentDto
import ai.zodecode.rpc.dto.AgentsDto
import ai.zodecode.rpc.dto.CommandDto
import ai.zodecode.rpc.dto.ZodeWorkspaceLoadProgressDto
import ai.zodecode.rpc.dto.LoadErrorDto
import ai.zodecode.rpc.dto.ModelDto
import ai.zodecode.rpc.dto.ModelLimitDto
import ai.zodecode.rpc.dto.ProviderDto
import ai.zodecode.rpc.dto.ProvidersDto
import ai.zodecode.rpc.dto.SkillDto

internal object ZodeWorkspaceDtoMapper {
    fun error(e: LoadError) = LoadErrorDto(
        resource = e.resource,
        status = e.status,
        detail = e.detail,
    )

    fun progress(p: ZodeWorkspaceLoadProgress) = ZodeWorkspaceLoadProgressDto(
        providers = p.providers,
        agents = p.agents,
        commands = p.commands,
        skills = p.skills,
    )

    fun providers(d: ProviderData) = ProvidersDto(
        providers = d.providers.map(::provider),
        connected = d.connected,
        defaults = d.defaults,
    )

    fun agents(d: AgentData) = AgentsDto(
        agents = d.agents.map(::agent),
        all = d.all.map(::agent),
        default = d.default,
    )

    fun command(c: CommandInfo) = CommandDto(
        name = c.name,
        description = c.description,
        source = c.source,
        hints = c.hints,
    )

    fun skill(s: SkillInfo) = SkillDto(
        name = s.name,
        description = s.description,
        location = s.location,
    )

    private fun provider(p: ProviderInfo) = ProviderDto(
        id = p.id,
        name = p.name,
        source = p.source,
        models = p.models.mapValues { (_, m) -> model(m) },
    )

    private fun model(m: ModelInfo) = ModelDto(
        id = m.id,
        name = m.name,
        attachment = m.attachment,
        reasoning = m.reasoning,
        temperature = m.temperature,
        toolCall = m.toolCall,
        free = m.free,
        status = m.status,
        recommendedIndex = m.recommendedIndex,
        variants = m.variants,
        limit = m.limit?.let { ModelLimitDto(it.context, it.input, it.output) },
    )

    private fun agent(a: AgentInfo) = AgentDto(
        name = a.name,
        displayName = a.displayName,
        description = a.description,
        mode = a.mode,
        native = a.native,
        hidden = a.hidden,
        color = a.color,
        deprecated = a.deprecated,
    )
}
