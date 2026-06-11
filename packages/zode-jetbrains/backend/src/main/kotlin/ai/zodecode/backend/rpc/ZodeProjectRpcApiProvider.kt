@file:Suppress("UnstableApiUsage")

package ai.zodecode.backend.rpc

import ai.zodecode.rpc.ZodeWorkspaceRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class ZodeProjectRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<ZodeWorkspaceRpcApi>()) {
            ZodeWorkspaceRpcApiImpl()
        }
    }
}
