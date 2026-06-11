package ai.zodecode.backend.dev

import ai.zodecode.log.ZodeLog

object ZodeDevMode {
    fun enabled(): Boolean = ZodeLog.sandbox()
}
