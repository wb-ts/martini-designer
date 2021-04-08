import { inject, injectable, postConstruct } from "inversify";
import {
    DatabaseConnection,
    DatabaseConnectionEvent,
    Driver,
    MartiniDatabaseConnectionManager,
    MartiniDatabaseConnectionManagerClient
} from "../../common/database-connection/martini-database-connection-manager";
import { MartiniEventDispatcher } from "../event/martini-event-manager";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class MartiniDatabaseConnectionManagerNode implements MartiniDatabaseConnectionManager {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;
    @inject(MartiniEventDispatcher)
    private readonly eventDispatcher: MartiniEventDispatcher;

    // @ts-ignore
    private client: MartiniDatabaseConnectionManagerClient | undefined;

    @postConstruct()
    init() {
        this.eventDispatcher.onEvent(event => {
            if (DatabaseConnectionEvent.is(event)) this.client?.onEvent(event);
        });
    }

    async getAll(): Promise<DatabaseConnection[]> {
        const response = await (await this.axiosFactory.make()).get("/esbapi/databases", {
            params: {
                size: 1000
            }
        });

        const body = response.data;

        if (response.status !== 200) {
            throw new Error(`Failed to fetch database connections: ${JSON.stringify(body)}`);
        }

        if (body.items) {
            return (body.items.map((item: any) => ({
                name: item.name,
                autoStart: item.autoStart,
                status: item.status,
                type: item.type
            })) as DatabaseConnection[]).sort((conn1, conn2) => conn1.name.localeCompare(conn2.name));
        }

        return [];
    }

    async get(name: string): Promise<DatabaseConnection> {
        const response = await (await this.axiosFactory.make()).get(`/esbapi/databases/${name}`);

        const body = response.data;

        if (response.status !== 200) {
            throw new Error(`Failed to fetch database connection '${name}': ${JSON.stringify(body)}`);
        }

        return body as DatabaseConnection;
    }

    async start(name: string): Promise<void> {
        await (await this.axiosFactory.make()).put(`/esbapi/databases/${name}/start`);
    }

    async stop(name: string): Promise<void> {
        await (await this.axiosFactory.make()).put(`/esbapi/databases/${name}/stop`);
    }

    async delete(name: string): Promise<void> {
        const connection = await this.get(name);

        if (connection.status !== "STOPPED") await this.stop(name);

        await (await this.axiosFactory.make()).delete(`/esbapi/databases/${name}`);
    }

    async save(connection: DatabaseConnection): Promise<void> {
        await (await this.axiosFactory.make()).post("/esbapi/databases", connection);
    }

    async test(connection: DatabaseConnection): Promise<void> {
        await (await this.axiosFactory.make()).post("/esbapi/databases/test-connection", connection);
    }

    async getDrivers(): Promise<Driver[]> {
        const response = await (await this.axiosFactory.make()).get("/esbapi/databases/drivers");
        if (response.status !== 200)
            throw new Error(`Failed to fetch database drivers: ${JSON.stringify(response.data)}`);

        return response.data as Driver[];
    }

    dispose(): void {
        // no-op
    }

    setClient(client: MartiniDatabaseConnectionManagerClient | undefined): void {
        this.client = client;
    }
}
