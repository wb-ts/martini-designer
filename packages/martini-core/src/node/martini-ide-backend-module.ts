import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { BackendApplicationContribution } from "@theia/core/lib/node/backend-application";
import { ContainerModule, inject, injectable } from "inversify";
import {
    MartiniEndpointManager,
    MartiniEndpointManagerClient,
    martiniEndpointManagerPath
} from "../common/endpoint/martini-endpoint-manager";
import { MartiniFileSystem, MartiniFileSystemClient, martiniFileSystemPath } from "../common/fs/martini-filesystem";
import { UrlReader, urlReaderPath } from "../common/fs/url-reader";
import {
    MartiniAccountManager,
    MartiniAccountManagerClient,
    martiniAccountManagerPath
} from "../common/instance/martini-account-manager";
import {
    MartiniInstanceInfoManager,
    MartiniInstanceInfoManagerClient,
    martiniInstanceInfoManagerPath
} from "../common/instance/martini-instance-info-manager";
import {
    MartiniPackageManager,
    MartiniPackageManagerClient,
    martiniPackageManagerPath
} from "../common/package/martini-package-manager";
import { bindDbConnectionBindings } from "./database-connection/database-connection-bindings";
import { MartiniEndpointManagerNode } from "./endpoint/node-martini-endpoint-manager";
import { MartiniEventDispatcher, MartiniEventDispatcherStomp } from "./event/martini-event-manager";
import { MartiniFileSystemNode } from "./fs/node-martini-filesystem";
import { UrlReaderNode } from "./fs/node-url-reader";
import {
    AxiosInstanceContribution,
    AxiosInstanceFactory,
    CachingAxiosInstanceFactory
} from "./http/axios-instance-factory";
import { AuthService, AuthServiceImpl } from "./instance/auth/auth-service";
import { MartiniAccountManagerNode } from "./instance/node-martini-account-manager";
import { MartiniInstanceInfoManagerNode } from "./instance/node-martini-instance-info-manager";
import { bindBrokerManager } from "./jms/node-martini-broker-manager";
import { MartiniPackageManagerNode } from "./package/node-martini-package-manager";
import { bindResourceSearchService } from "./search/node-resource-search-service";
import { bindServiceSearchService } from "./search/node-service-search-service";
import { UserStorageService } from "./storage/user-storage-service";
import { UserStorageServiceFilesystemImpl } from "./storage/user-storage-service-filesystem";
import { bindTrackerBindings } from "./tracker/tracker-bindings";
import { MartiniStompClient, MartiniStompClientNode } from "./ws/martini-stomp-client";

export default new ContainerModule(bind => {
    bind(AxiosInstanceFactory)
        .to(CachingAxiosInstanceFactory)
        .inSingletonScope();

    bind(BackendApplicationContribution)
        .to(MartiniIdeBackendContribution)
        .inSingletonScope();

    bind(UserStorageService)
        .to(UserStorageServiceFilesystemImpl)
        .inSingletonScope();
    bind(MartiniInstanceInfoManager)
        .to(MartiniInstanceInfoManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniInstanceInfoManagerClient>(
                    martiniInstanceInfoManagerPath,
                    client => {
                        const manager = ctx.container.get<MartiniInstanceInfoManager>(MartiniInstanceInfoManager);
                        manager.setClient(client);
                        return manager;
                    }
                )
        )
        .inSingletonScope();

    bind(MartiniAccountManagerNode)
        .toSelf()
        .inSingletonScope();
    bind(MartiniAccountManager).toService(MartiniAccountManagerNode);
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniAccountManagerClient>(martiniAccountManagerPath, client => {
                    const manager = ctx.container.get<MartiniAccountManager>(MartiniAccountManager);
                    manager.setClient(client);
                    return manager;
                })
        )
        .inSingletonScope();

    bind(AuthService)
        .to(AuthServiceImpl)
        .inSingletonScope();
    bind(AxiosInstanceContribution).toService(AuthService);

    bind(MartiniStompClient)
        .to(MartiniStompClientNode)
        .inSingletonScope();
    bind(MartiniEventDispatcherStomp)
        .toSelf()
        .inSingletonScope();
    bind(MartiniEventDispatcher).toService(MartiniEventDispatcherStomp);

    bind(MartiniPackageManager)
        .to(MartiniPackageManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniPackageManagerClient>(martiniPackageManagerPath, client => {
                    const manager = ctx.container.get<MartiniPackageManager>(MartiniPackageManager);
                    manager.setClient(client);
                    return manager;
                })
        )
        .inSingletonScope();
    bindDbConnectionBindings(bind);
    bind(MartiniFileSystem)
        .to(MartiniFileSystemNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniFileSystemClient>(martiniFileSystemPath, client => {
                    const manager = ctx.container.get<MartiniFileSystem>(MartiniFileSystem);
                    manager.setClient(client);
                    return manager;
                })
        )
        .inSingletonScope();
    bind(UrlReader)
        .to(UrlReaderNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(ctx => new JsonRpcConnectionHandler(urlReaderPath, () => ctx.container.get(UrlReader)))
        .inSingletonScope();
    bind(MartiniEndpointManager)
        .to(MartiniEndpointManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniEndpointManagerClient>(martiniEndpointManagerPath, client => {
                    const manager = ctx.container.get<MartiniEndpointManager>(MartiniEndpointManager);
                    manager.setClient(client);
                    return manager;
                })
        )
        .inSingletonScope();
    bindBrokerManager(bind);
    bindTrackerBindings(bind);
    bindResourceSearchService(bind);
    bindServiceSearchService(bind);
});

@injectable()
class MartiniIdeBackendContribution implements BackendApplicationContribution {
    @inject(MartiniAccountManager)
    private readonly accountManager: MartiniAccountManager;

    initialize() {
        this.doInit();
    }

    async doInit() {
        await this.accountManager.set(process.env.MR_USERNAME || "", process.env.MR_PASSWORD || "");
    }
}
