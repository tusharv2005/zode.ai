@file:Suppress("UnstableApiUsage")

package ai.zodecode.backend.rpc

import ai.zodecode.rpc.ZodeAppRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class ZodeAppRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<ZodeAppRpcApi>()) {
            ZodeAppRpcApiImpl()
        }
    }
}
