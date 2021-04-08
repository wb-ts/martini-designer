export interface DatabaseSchema {
    name: string;
    catalogName: string;
}

export const martiniDatabaseSchemaProviderPath = "/services/martini/database/schemas";

export const MartiniDatabaseSchemaProvider = Symbol("MartiniDatabaseSchemaProvider");

export interface MartiniDatabaseSchemaProvider {
    getAll(connectionName: string): Promise<DatabaseSchema[]>;
}
