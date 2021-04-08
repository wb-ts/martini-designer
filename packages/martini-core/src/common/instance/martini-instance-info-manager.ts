import {JsonRpcServer} from "@theia/core";
import URI from "@theia/core/lib/common/uri";

export interface MartiniInstanceInfo {
    address: string;
    port: number;
    secured: boolean;
}

export namespace MartiniInstanceInfo {
    export function getUri(info: MartiniInstanceInfo, path?: string): URI {
        let hostPort = info.address;
        if (info.port > 0) hostPort = info.address + ":" + info.port;
        const uri = new URI((info.secured ? "https" : "http") + "://" + hostPort);

        if (path) return uri.resolve(path);

        return uri;
    }

    export function is(object: any): object is MartiniInstanceInfo {
        return (
            !!object &&
            typeof object === "object" &&
            "address" in object &&
            "port" in object &&
            "secured" in object
        );
    }
}

export const martiniInstanceInfoManagerPath = "/services/martini/instance/info";

export const MartiniInstanceInfoManager = Symbol("MartiniInstanceInfoManager");

export interface MartiniInstanceInfoManager
    extends JsonRpcServer<MartiniInstanceInfoManagerClient> {
    get(): Promise<MartiniInstanceInfo>;
}

export interface MartiniInstanceInfoManagerClient {
    onUpdated?(oldInfo: MartiniInstanceInfo, newInfo: MartiniInstanceInfo): void;

    onReady?(): void;
}
