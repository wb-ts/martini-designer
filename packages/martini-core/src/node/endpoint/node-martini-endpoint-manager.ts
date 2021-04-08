import { inject, injectable, postConstruct } from "inversify";
import {
    EndpointEvent,
    MartiniEndpoint,
    MartiniEndpointManager,
    MartiniEndpointManagerClient
} from "../../common/endpoint/martini-endpoint-manager";
import { MartiniEventDispatcher } from "../event/martini-event-manager";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class MartiniEndpointManagerNode implements MartiniEndpointManager {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;
    @inject(MartiniEventDispatcher)
    private readonly eventDispatcher: MartiniEventDispatcher;

    private client: MartiniEndpointManagerClient | undefined;
    private readonly excludedPayloadProperties = [
        "type",
        "name",
        "service",
        "packageName",
        "enabled",
        "modifiable",
        "status"
    ];

    @postConstruct()
    init() {
        this.eventDispatcher.onEvent(event => {
            if (EndpointEvent.is(event)) this.client?.onEvent(event);
        });
    }

    async getAll(packageName: string): Promise<MartiniEndpoint[]> {
        const response = await (await this.axiosFactory.make()).get(`/esbapi/packages/${packageName}/endpoints`, {
            params: { size: 1000 }
        });

        if (response.status !== 200) return [];

        return response.data.items.map((item: any) => ({
            type: item.type,
            name: item.name,
            service: item.service,
            packageName: item.packageName,
            enabled: item.enabled,
            modifiable: item.modifiable,
            status: item.status
        }));
    }

    async get(packageName: string, endpointName: string): Promise<MartiniEndpoint | undefined> {
        const response = await (await this.axiosFactory.make()).get(
            `/esbapi/packages/${packageName}/endpoints/${endpointName}`
        );

        if (response.status !== 200) return undefined;

        const data = response.data;

        return {
            type: data.type,
            name: data.name,
            service: data.service,
            packageName: data.packageName,
            enabled: data.enabled,
            modifiable: data.modifiable,
            status: data.status,
            ...data.properties
        };
    }

    async start(packageName: string, endpointName: string): Promise<void> {
        await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/endpoints/${endpointName}/start`);
    }

    async stop(packageName: string, endpointName: string): Promise<void> {
        await (await this.axiosFactory.make()).put(`/esbapi/packages/${packageName}/endpoints/${endpointName}/stop`);
    }

    async delete(packageName: string, endpointName: string): Promise<void> {
        const endpoint = await this.get(packageName, endpointName);

        if (endpoint && endpoint.status !== "STOPPED") await this.stop(packageName, endpointName);

        await (await this.axiosFactory.make()).delete(`/esbapi/packages/${packageName}/endpoints/${endpointName}`);
    }

    async save(packageName: string, endpoint: MartiniEndpoint): Promise<void> {
        await (await this.axiosFactory.make()).post(
            `/esbapi/packages/${packageName}/endpoints`,
            this.toSavePayload(endpoint)
        );
    }

    async test(packageName: string, endpoint: MartiniEndpoint): Promise<void> {
        await (await this.axiosFactory.make()).put(
            `/esbapi/packages/${packageName}/endpoints/validate`,
            this.toTestPayload(endpoint)
        );
    }

    private toSavePayload(endpoint: MartiniEndpoint) {
        return {
            type: endpoint.type,
            name: endpoint.name,
            endpointType: endpoint.name,
            endpointName: endpoint.name,
            service: endpoint.service,
            packageName: endpoint.packageName,
            enabled: endpoint.enabled,
            modifiable: endpoint.modifiable,
            properties: this.getProperties(endpoint)
        };
    }

    private toTestPayload(endpoint: MartiniEndpoint) {
        return {
            endpointName: endpoint.name,
            endpointType: endpoint.type,
            originalEndpointName: endpoint.name,
            enabled: endpoint.enabled,
            packageName: endpoint.packageName,
            serviceName: endpoint.service,
            properties: this.getProperties(endpoint)
        };
    }

    private getProperties(endpoint: MartiniEndpoint) {
        return Object.entries(endpoint)
            .filter(([key, _]) => !this.excludedPayloadProperties.includes(key))
            .reduce((properties, [key, value]) => {
                properties[key] = value;
                return properties;
            }, {} as { [key: string]: any });
    }

    dispose(): void {}

    setClient(client: MartiniEndpointManagerClient | undefined): void {
        this.client = client;
    }
}
