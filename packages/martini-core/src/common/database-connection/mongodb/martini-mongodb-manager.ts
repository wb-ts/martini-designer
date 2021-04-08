export interface MongoDbDatabaseMetadata {
    empty: boolean;
    name: string;
    sizeOnDisk: number;
}

export interface MongoDbCollectionMetadata {
    id: string;
    name: string;
    readOnly: boolean;
    count: number;
}

export const martiniMongoDbManagerPath = "/services/martini/database/mongodb";

export const MartiniMongoDbManager = Symbol("MartiniMongoDbManager");

export interface MartiniMongoDbManager {
    getDatabases(connectionName: string): Promise<MongoDbDatabaseMetadata[]>;
    getCollections(connectionName: string, databaseName: string): Promise<MongoDbCollectionMetadata[]>;
}
