import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { interfaces } from "inversify";
import {
    MartiniDatabaseConnectionManager,
    MartiniDatabaseConnectionManagerClient,
    martiniDatabaseConnectionManagerPath
} from "../../common/database-connection/martini-database-connection-manager";
import {
    MartiniDatabaseSchemaProvider,
    martiniDatabaseSchemaProviderPath
} from "../../common/database-connection/schema/martini-database-schema-provider";
import { bindMongoDbManager } from "./mongodb/node-mongodb-manager";
import { MartiniDatabaseConnectionManagerNode } from "./node-database-connection-manager";
import { MartiniDatabaseSchemaManagerNode } from "./schema/node-database-schema-provider";

export const bindDbConnectionBindings = (bind: interfaces.Bind) => {
    bind(MartiniDatabaseConnectionManager)
        .to(MartiniDatabaseConnectionManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<MartiniDatabaseConnectionManagerClient>(
                    martiniDatabaseConnectionManagerPath,
                    client => {
                        const manager = ctx.container.get<MartiniDatabaseConnectionManager>(
                            MartiniDatabaseConnectionManager
                        );
                        manager.setClient(client);
                        return manager;
                    }
                )
        )
        .inSingletonScope();
    bind(MartiniDatabaseSchemaProvider)
        .to(MartiniDatabaseSchemaManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler(martiniDatabaseSchemaProviderPath, _ =>
                    ctx.container.get<MartiniDatabaseSchemaProvider>(MartiniDatabaseSchemaProvider)
                )
        )
        .inSingletonScope();
    bindMongoDbManager(bind);
};
