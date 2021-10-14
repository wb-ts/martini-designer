import { inject, injectable, postConstruct } from "inversify";
import {
    EmailEndpoint,
    EndpointEvent,
    EndpointType,
    MartiniEndpoint,
    MartiniEndpointManager,
    MartiniEndpointManagerClient,
    RssEndpoint,
    SchedulerEndpoint
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
        "status",
        "replicated",
        "track",
        "documentType"
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

        let endpoint: MartiniEndpoint = {
            type: data.type,
            name: data.name,
            service: data.service,
            packageName: data.packageName,
            enabled: data.enabled,
            modifiable: data.modifiable,
            status: data.status,
            replicated: data.properties.replicated === "true",
            track: data.properties.track === "true",
            documentType: data.properties.documentType,
        };

        if (response.data.type === "email") {
            endpoint = {
                ...endpoint,
                host: data.properties.host || "",
                port: Number.parseInt(data.properties.port || "1"),
                username: data.properties.username,
                password: data.properties.password,
                schedule: data.properties.schedule,
                protocol: data.properties.type,
                ssl: data.properties.ssl === "true",
                sendReplyOnError: data.properties.sendReplyOnError === "true",
                sendOutputAsReply: data.properties.sendOutputAsReply === "true",
                deleteOnReceive: data.properties.deleteOnReceive === "true",
                replyEmailSettings: {
                    host: data.properties["reply-host"] || "",
                    port: Number.parseInt(data.properties["reply-port"] || "1"),
                    username: data.properties["reply-username"] || "",
                    password: data.properties["reply-password"],
                    from: data.properties["reply-from"] || "",
                    ssl: data.properties["reply-ssl"] === "true",
                }
            } as EmailEndpoint;
        }
        else if (response.data.type === "rss") {
            endpoint = {
                ...endpoint,
                rssUrl: data.properties.rssUrl || "",
                schedule: data.properties.schedule || "",
                onlyNew: data.properties.onlyNew === "true"
            } as RssEndpoint;
        } else if (response.data.type === "scheduler") {
            endpoint = {
                ...endpoint,
                scheduleType: data.properties.scheduleType || "",
                stateful: data.properties.stateful === "true",
                cronSettings: {
                    dayType: data.properties.cronDayType || "",
                    months: data.properties.months || "",
                    weekdays: data.properties.weekdays || "",
                    days: data.properties.days || "",
                    hours: data.properties.hours || "",
                    minutes: data.properties.minutes || "",
                    seconds: data.properties.seconds || ""
                },
                simpleRepeatingSettings: {
                    interval: Number.parseInt(data.properties.interval || "1")
                }
            } as SchedulerEndpoint;
        }
        return endpoint;
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
            endpointName: endpoint.name,
            endpointType: endpoint.type,
            serviceName: endpoint.service,
            packageName: endpoint.packageName,
            enabled: endpoint.enabled,
            modifiable: endpoint.modifiable,
            properties: {
                replicated: endpoint.replicated,
                track: endpoint.track,
                documentType: endpoint.documentType,
                ...this.getProperties(endpoint)
            }
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
            properties: {
                replicated: endpoint.replicated,
                track: endpoint.track,
                documentType: endpoint.documentType,
                ...this.getProperties(endpoint)
            }
        };
    }

    private getProperties(endpoint: MartiniEndpoint) {
        switch (endpoint.type) {
            case EndpointType.EMAIL: {
                const _endpoint = endpoint as EmailEndpoint;
                return {
                    host: _endpoint.host,
                    port: _endpoint.port,
                    username: _endpoint.username,
                    password: _endpoint.password,
                    schedule: _endpoint.schedule,
                    type: _endpoint.protocol,
                    ssl: _endpoint.ssl,
                    sendReplyOnError: _endpoint.sendReplyOnError,
                    sendOutputAsReply: _endpoint.sendOutputAsReply,
                    deleteOnReceive: _endpoint.deleteOnReceive,
                    "reply-host": _endpoint.replyEmailSettings.host,
                    "reply-port": _endpoint.replyEmailSettings.port,
                    "reply-username": _endpoint.replyEmailSettings.username,
                    "reply-password": _endpoint.replyEmailSettings.password,
                    "reply-from": _endpoint.replyEmailSettings.from,
                    "reply-ssl": _endpoint.replyEmailSettings.ssl,
                };
            }
            case EndpointType.SCHEDULER: {
                const _endpoint = endpoint as SchedulerEndpoint;
                return {
                    scheduleType: _endpoint.scheduleType,
                    stateful: _endpoint.stateful,
                    dayType: _endpoint.cronSettings.dayType,
                    months: _endpoint.cronSettings.months,
                    weekdays: _endpoint.cronSettings.weekdays,
                    days: _endpoint.cronSettings.days,
                    hours: _endpoint.cronSettings.hours,
                    minutes: _endpoint.cronSettings.minutes,
                    seconds: _endpoint.cronSettings.seconds,
                    interval: _endpoint.simpleRepeatingSettings.interval
                };
            }
        }

        return Object.entries(endpoint)
            .filter(([key, _]) => !this.excludedPayloadProperties.includes(key))
            .reduce((properties, [key, value]) => {
                properties[key] = value;
                return properties;
            }, {} as { [key: string]: any; });
    }

    dispose(): void { }

    setClient(client: MartiniEndpointManagerClient | undefined): void {
        this.client = client;
    }
}
