@file:Suppress("UnstableApiUsage")

package ai.zodecode.backend.rpc

import ai.zodecode.rpc.ZodeMigrationRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class ZodeMigrationRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<ZodeMigrationRpcApi>()) {
            ZodeMigrationRpcApiImpl()
        }
    }
}
