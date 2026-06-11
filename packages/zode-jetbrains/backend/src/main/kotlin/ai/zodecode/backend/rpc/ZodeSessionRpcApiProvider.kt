@file:Suppress("UnstableApiUsage")

package ai.zodecode.backend.rpc

import ai.zodecode.rpc.ZodeSessionRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class ZodeSessionRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<ZodeSessionRpcApi>()) {
            ZodeSessionRpcApiImpl()
        }
    }
}
