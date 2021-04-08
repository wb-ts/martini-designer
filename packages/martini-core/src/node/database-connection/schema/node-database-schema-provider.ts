import { inject, injectable } from "inversify";
import {
    DatabaseSchema,
    MartiniDatabaseSchemaProvider
} from "../../../common/database-connection/schema/martini-database-schema-provider";
import { AxiosInstanceFactory } from "../../http/axios-instance-factory";

@injectable()
export class MartiniDatabaseSchemaManagerNode implements MartiniDatabaseSchemaProvider {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async getAll(connectionName: string): Promise<DatabaseSchema[]> {
        const response = await (await this.axiosFactory.make()).get(`/esbapi/databases/${connectionName}/schemas`);

        if (response.status !== 200)
            throw new Error(
                `Failed to fetch database schemas with connection '${name}': ${JSON.stringify(response.data)}`
            );

        return response.data || [];
    }
}
