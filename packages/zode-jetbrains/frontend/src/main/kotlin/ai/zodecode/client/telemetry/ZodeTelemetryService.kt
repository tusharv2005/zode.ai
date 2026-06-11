@file:Suppress("UnstableApiUsage")

package ai.zodecode.client.telemetry

import ai.zodecode.log.ZodeLog
import ai.zodecode.rpc.ZodeAppRpcApi
import ai.zodecode.rpc.dto.TelemetryCaptureDto
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import fleet.rpc.client.durable
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

object Telemetry {
    fun send(event: String, properties: Map<String, String> = emptyMap()) {
        ZodeTelemetryService.getInstance().send(event, properties)
    }
}

@Service(Service.Level.APP)
class ZodeTelemetryService internal constructor(
    private val cs: CoroutineScope,
    private val rpc: ZodeAppRpcApi?,
) {
    constructor(cs: CoroutineScope) : this(cs, null)

    companion object {
        private val LOG = ZodeLog.create(ZodeTelemetryService::class.java)
        private const val MAX_PENDING = 64
        private const val TIMEOUT_MS = 5_000L

        fun getInstance(): ZodeTelemetryService = service()
    }

    private val pending = AtomicInteger()
    private val warned = AtomicBoolean()

    fun send(event: String, properties: Map<String, String> = emptyMap()) {
        if (pending.incrementAndGet() > MAX_PENDING) {
            pending.decrementAndGet()
            if (warned.compareAndSet(false, true)) {
                LOG.warn("telemetry backpressure: dropping events with more than $MAX_PENDING pending")
            }
            return
        }
        cs.launch {
            try {
                if (ZodeLog.sandbox()) {
                    val payload = ZodeLog.payload(LOG) + properties
                    LOG.info("event=$event ${payload.entries.joinToString(" ") { "${it.key}=${it.value}" }}")
                    return@launch
                }
                val dto = TelemetryCaptureDto(event, properties)
                val sent = withTimeoutOrNull(TIMEOUT_MS) {
                    val api = rpc
                    if (api != null) api.captureTelemetry(dto)
                    else durable { ZodeAppRpcApi.getInstance().captureTelemetry(dto) }
                    true
                }
                if (sent != true) LOG.warn("telemetry capture timed out: $event")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                LOG.warn("telemetry capture failed: ${e.message}", e)
            } finally {
                pending.decrementAndGet()
            }
        }
    }
}
