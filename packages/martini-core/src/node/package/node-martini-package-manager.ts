import { inject, injectable, postConstruct } from "inversify";
import {
    MartiniPackage,
    MartiniPackageCreateConfig,
    MartiniPackageEvent,
    MartiniPackageManager,
    MartiniPackageManagerClient,
    PartialMartiniPackage
} from "../../common/package/martini-package-manager";
import { MartiniEventDispatcher } from "../event/martini-event-manager";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class MartiniPackageManagerNode implements MartiniPackageManager {
    @inject(MartiniEventDispatcher)
    private eventDispatcher: MartiniEventDispatcher;
    @inject(AxiosInstanceFactory) private axiosFactory: AxiosInstanceFactory;

    // @ts-ignore
    private client: MartiniPackageManagerClient | undefined;

    @postConstruct()
    init() {
        this.eventDispatcher.onEvent(event => {
            if (MartiniPackageEvent.is(event)) this.client?.onEvent(event);
        });
    }

    async getAll(): Promise<PartialMartiniPackage[]> {
        const response = await (await this.axiosFactory.make()).get("/esbapi/packages", {
            params: {
                size: 1000
            }
        });

        const body = response.data;

        if (response.status !== 200) {
            throw new Error(`Failed to fetch Martini packages: ${JSON.stringify(body)}`);
        }

        if (body.items) {
            return body.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                version: item.version,
                status: item.status
            })) as PartialMartiniPackage[];
        }

        return [];
    }

    async get(packageName: string): Promise<MartiniPackage> {
        const response = await (await this.axiosFactory.make()).get(`/esbapi/packages/${packageName}`, {
            params: {
                size: 1000
            }
        });

        const body = response.data;

        if (response.status !== 200) {
            throw new Error(`Failed to fetch packages: ${JSON.stringify(body)}`);
        }

        return {
            id: body.id,
            name: body.name,
            version: body.version,
            status: body.status
        } as MartiniPackage;
    }

    async start(packageName: string): Promise<void> {
        const response = await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/start`);

        if (response.status !== 202) {
            throw new Error(`Failed to start Martini package '${packageName}': ${JSON.stringify(response.data)}`);
        }
    }

    async stop(packageName: string): Promise<void> {
        const response = await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/stop`);

        if (response.status !== 202) {
            throw new Error(`Failed to stop Martini package '${packageName}': ${JSON.stringify(response.data)}`);
        }
    }

    async load(packageName: string): Promise<void> {
        const response = await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/load`);

        if (response.status !== 202) {
            throw new Error(`Failed to load Martini package '${packageName}': ${JSON.stringify(response.data)}`);
        }
    }

    async unload(packageName: string): Promise<void> {
        const response = await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/unload`);

        if (response.status !== 202) {
            throw new Error(`Failed to unload Martini package '${packageName}': ${JSON.stringify(response.data)}`);
        }
    }

    async restart(packageName: string): Promise<void> {
        await this.stop(packageName);
        await this.start(packageName);
    }

    async delete(packageName: string): Promise<void> {
        const pckage = await this.get(packageName);

        if (pckage.status === "STARTED") await this.stop(packageName);

        const response = await (await this.axiosFactory.make()).delete(`/esbapi/packages/${packageName}`);

        if (response.status !== 204) {
            throw new Error(`Failed to unload Martini package '${packageName}': ${JSON.stringify(response.data)}`);
        }
    }

    async create(config: MartiniPackageCreateConfig): Promise<void> {
        const response = await (await this.axiosFactory.make()).post(`/esbapi/packages`, config);
        if (response.status !== 200) {
            throw new Error(`Failed to create Martini package '${config.name}': ${JSON.stringify(response.data)}`);
        }
    }

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    setClient(client: MartiniPackageManagerClient | undefined): void {
        this.client = client;
    }
}
