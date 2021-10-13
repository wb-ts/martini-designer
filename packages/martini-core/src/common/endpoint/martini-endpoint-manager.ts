import { JsonRpcServer } from "@theia/core";
import { MartiniEvent } from "../event/martini-event";

export const martiniEndpointManagerPath = "/services/martini/endpoints";

export enum EndpointType {
    DIR_WATCHER = "dir-watcher",
    EMAIL = "email",
    FTP_CLIENT = "ftp-client",
    FTP_SERVER = "ftp-server",
    HTTP_FILTER = "http-filter",
    JABBER = "jabber",
    JMS_LISTENER = "jms-listener",
    KAFKA_LISTENER = "kafka-listener",
    MONGODB_LISTENER = "mongodb-listener",
    URL_ALIAS = "rest-alias",
    RSS = "rss",
    SCHEDULER = "scheduler",
    TRACKER_RESUBMIT = "tracker-resubmit",
    REDIS_LISTENER = "redis-listener"
}

export interface MartiniEndpoint {
    type: EndpointType;
    name: string;
    service: string;
    packageName: string;
    enabled: boolean;
    modifiable: boolean;
    documentType: string;
    track: boolean;
    replicated: boolean;
    status: "STARTED" | "STOPPED";
}

export namespace MartiniEndpoint {
    export function is(object: any): object is MartiniEndpoint {
        return (
            !!object &&
            typeof object === "object" &&
            "type" in object &&
            "name" in object &&
            "service" in object &&
            "packageName" in object &&
            "enabled" in object &&
            "modifiable" in object &&
            "status" in object
        );
    }
    export function getType(type: string): EndpointType | undefined {
        const typeKey: string | undefined = Object.keys(EndpointType).find(
            (key: string) => EndpointType[key as keyof typeof EndpointType] === type
        );
        return typeKey ? EndpointType[typeKey as keyof typeof EndpointType] : undefined;
    }
}

export const MartiniEndpointManager = Symbol("MartiniEndpointManager");

export interface MartiniEndpointManager extends JsonRpcServer<MartiniEndpointManagerClient> {
    getAll(packageName: string): Promise<MartiniEndpoint[]>;

    get(packageName: string, endpointName: string): Promise<MartiniEndpoint | undefined>;

    start(packageName: string, endpointName: string): Promise<void>;

    stop(packageName: string, endpointName: string): Promise<void>;

    delete(packageName: string, endpointName: string): Promise<void>;

    save(packageName: string, endpoint: MartiniEndpoint): Promise<void>;

    test(packageName: string, endpoint: MartiniEndpoint): Promise<void>;
}

export interface EndpointEvent extends MartiniEvent {
    name: string;
    packageName: string;
    event: "STARTED" | "STOPPED" | "DELETED" | "SAVED";
}

export namespace EndpointEvent {
    export function is(event: MartiniEvent): event is EndpointEvent {
        return event.type === "ENDPOINT";
    }
}

export interface MartiniEndpointManagerClient {
    onEvent(event: EndpointEvent): void;
}

export const getDisplayName = (type: EndpointType): string => {
    switch (type) {
        case EndpointType.DIR_WATCHER:
            return "Directory Watcher";
        case EndpointType.EMAIL:
            return "Email";
        case EndpointType.KAFKA_LISTENER:
            return "Kafka Listener";
        case EndpointType.SCHEDULER:
            return "Scheduler";
        case EndpointType.TRACKER_RESUBMIT:
            return "Tracker Resubmit";
        case EndpointType.JABBER:
            return "Jabber";
        case EndpointType.FTP_CLIENT:
            return "FTP Client";
        case EndpointType.FTP_SERVER:
            return "FTP Server";
        case EndpointType.JMS_LISTENER:
            return "JMS Listener";
        case EndpointType.RSS:
            return "RSS";
        case EndpointType.URL_ALIAS:
            return "URL Alias";
        case EndpointType.MONGODB_LISTENER:
            return "MongoDB Listener";
        case EndpointType.REDIS_LISTENER:
            return "Redis Pub/Sub Listener";
        case EndpointType.HTTP_FILTER:
            return "HTTP Filter";
        default:
            return "Unknown";
    }
};

export interface RssEndpoint extends MartiniEndpoint {
    schedule: string;
    onlyNew: boolean;
    rssUrl: string;
}

export interface EmailSettings {
    host: string;
    port: number;
    username: string;
    password: string;
    ssl: boolean;
}

export interface ReplyEmailSettings extends EmailSettings {
    from: string;
}

export interface EmailEndpoint extends MartiniEndpoint, EmailSettings {
    schedule: string;
    replicated: boolean;
    track : boolean;
    protocol: "imap" | "pop3";
    deleteOnReceive: boolean;
    sendOutputAsReply: boolean;
    sendReplyOnError: boolean;
    replyEmailSettings: ReplyEmailSettings;
}
