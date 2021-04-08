import { JsonRpcServer } from "@theia/core";
import { MartiniEvent } from "../event/martini-event";

export interface PartialMartiniPackage {
    id: string;
    name: string;
    version: string;
    status: PackageStatus;
}

export namespace PartialMartiniPackage {
    export function is(object: any): object is PartialMartiniPackage {
        return (
            !!object &&
            typeof object === "object" &&
            "id" in object &&
            "name" in object &&
            "version" in object &&
            "status" in object
        );
    }
}

export interface MartiniPackage extends PartialMartiniPackage {
    contextPath: string;
    stateOnStartup: PackageStatus;
    dependsOn: any[];
    startupServices: any[];
    shutdownServices: any[];
    jmsDestinations: any[];
}

export interface MartiniPackageCreateConfig {
    name: string;
    marketplaceId: string;
    version: string;
    stateOnStartUp: "UNLOADED" | "LOADED" | "STARTED";
}

export type PackageStatus =
    | "LOADING"
    | "LOADED"
    | "LOAD_FAILED"
    | "UNLOADING"
    | "UNLOADED"
    | "STARTING"
    | "STARTED"
    | "START_FAILED"
    | "STOPPING";

export const martiniPackageManagerPath = "services/martini/packages";

export const MartiniPackageManager = Symbol("MartiniPackageManager");

export interface MartiniPackageManager extends JsonRpcServer<MartiniPackageManagerClient> {
    getAll(): Promise<PartialMartiniPackage[]>;

    get(packageName: string): Promise<MartiniPackage>;

    start(packageName: string): Promise<void>;

    stop(packageName: string): Promise<void>;

    load(packageName: string): Promise<void>;

    unload(packageName: string): Promise<void>;

    restart(packageName: string): Promise<void>;

    delete(packageName: string): Promise<void>;

    create(config: MartiniPackageCreateConfig): Promise<void>;
}

export interface MartiniPackageEvent extends MartiniEvent {
    type: "PACKAGE";
    packageName: string;
    event: "STOP" | "START" | "UNLOAD" | "LOAD" | "DELETED" | "ADD";
}

export namespace MartiniPackageEvent {
    export function is(event: MartiniEvent): event is MartiniPackageEvent {
        return event.type === "PACKAGE";
    }
}

export interface MartiniPackageManagerClient {
    onEvent(event: MartiniPackageEvent): void;
}
