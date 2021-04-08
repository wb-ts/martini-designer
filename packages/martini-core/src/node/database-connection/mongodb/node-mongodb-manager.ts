import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { inject, injectable, interfaces } from "inversify";
import {
    MartiniMongoDbManager,
    martiniMongoDbManagerPath,
    MongoDbCollectionMetadata,
    MongoDbDatabaseMetadata
} from "../../../common/database-connection/mongodb/martini-mongodb-manager";
import { AxiosInstanceFactory } from "../../http/axios-instance-factory";

@injectable()
export class MartiniMongoDBManagerNode implements MartiniMongoDbManager {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async getDatabases(connectionName: string): Promise<MongoDbDatabaseMetadata[]> {
        const response = await (await this.axiosFactory.make()).get(
            `/esbapi/databases/mongo/${connectionName}/databases`
        );

        if (response.status !== 200)
            throw new Error(
                `Failed to fetch MongoDB databases with connection '${connectionName}'.` +
                    `: ${JSON.stringify(response.data)}`
            );

        return response.data || [];
    }

    async getCollections(connectionName: string, databaseName: string): Promise<MongoDbCollectionMetadata[]> {
        const response = await (await this.axiosFactory.make()).get(
            `/esbapi/databases/mongo/${connectionName}/${databaseName}/collections`
        );

        if (response.status !== 200)
            throw new Error(
                `Failed to fetch MongoDB collections with connection '${connectionName}' and database '${databaseName}'.` +
                    `: ${JSON.stringify(response.data)}`
            );

        return response.data || [];
    }
}

export const bindMongoDbManager = (bind: interfaces.Bind) => {
    bind(MartiniMongoDbManager)
        .to(MartiniMongoDBManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler(martiniMongoDbManagerPath, _ => ctx.container.get(MartiniMongoDbManager))
        )
        .inSingletonScope();
};
