import { Emitter, Event } from "@theia/core";
import { inject, injectable, postConstruct } from "inversify";
import { DatabaseConnectionEvent } from "../../common/database-connection/martini-database-connection-manager";
import { EndpointEvent } from "../../common/endpoint/martini-endpoint-manager";
import { MartiniEvent } from "../../common/event/martini-event";
import { MartiniFileEvent } from "../../common/fs/martini-filesystem";
import { MartiniPackageEvent } from "../../common/package/martini-package-manager";
import { MartiniStompClient } from "../ws/martini-stomp-client";

export const MartiniEventDispatcher = Symbol("MartiniEventDispatcher");

export interface MartiniEventDispatcher {
    onEvent: Event<MartiniEvent>;
}

@injectable()
export class MartiniEventDispatcherStomp implements MartiniEventDispatcher {
    private static readonly EVENTS_TOPIC = "/topic/io/toro/martini/events";

    private readonly onEventEmitter = new Emitter<MartiniEvent>();
    readonly onEvent = this.onEventEmitter.event;

    @inject(MartiniStompClient)
    private readonly stompClient: MartiniStompClient;

    @postConstruct()
    async init() {
        this.stompClient.subscribe(MartiniEventDispatcherStomp.EVENTS_TOPIC, (_, body) =>
            this.handleEventMessage(body)
        );
    }

    private handleEventMessage(message: any) {
        const json = JSON.parse(message);
        const type = json.type;

        switch (type) {
            case "PACKAGE_LIFECYCLE":
            case "PACKAGE_CONFIG":
                this.onEventEmitter.fire(this.parsePackageEvent(json));
                break;
            case "FILE":
                this.onEventEmitter.fire(this.parseFileEvent(json));
                break;
            case "ENDPOINT":
                this.onEventEmitter.fire(this.parseEndpointEvent(json));
                break;
            case "DATABASE":
                this.onEventEmitter.fire(this.parseDatabaseConnectionEvent(json));
                break;
        }
    }

    private parsePackageEvent(event: any): MartiniPackageEvent {
        return {
            type: "PACKAGE",
            event: event.event,
            packageName: event.packageName
        };
    }

    private parseFileEvent(event: any): MartiniFileEvent {
        return {
            type: "FILE",
            action: event.action,
            paths: event.files.map((fileInfo: any) => ("/" + fileInfo.path) as string)
        };
    }

    private parseEndpointEvent(event: any): EndpointEvent {
        return {
            type: "ENDPOINT",
            name: event.endpoint.name,
            packageName: event.packageName,
            event: event.event
        };
    }

    private parseDatabaseConnectionEvent(event: any): DatabaseConnectionEvent {
        return {
            type: "DATABASE_CONNECTION",
            name: event.database.name,
            event: event.event
        };
    }
}
