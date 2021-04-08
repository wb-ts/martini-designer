import { Emitter, Event } from "@theia/core";
import { injectable } from "inversify";
import { DatabaseConnectionEvent } from "../../common/database-connection/martini-database-connection-manager";
import { MartiniEndpointManagerClient } from "../../common/endpoint/martini-endpoint-manager";

export const DatabaseConnectionEventDispatcher = Symbol("DatabaseConnectionEventDispatcher");

export interface DatabaseConnectionEventDispatcher {
    onDatabaseConnectionEvent: Event<DatabaseConnectionEvent>;
}

@injectable()
export class DatabaseConnectionEventDispatcherClient
    implements MartiniEndpointManagerClient, DatabaseConnectionEventDispatcher {
    private readonly onDatabaseConnectionEventEmitter = new Emitter<DatabaseConnectionEvent>();
    readonly onDatabaseConnectionEvent = this.onDatabaseConnectionEventEmitter.event;

    onEvent(event: DatabaseConnectionEvent): void {
        this.onDatabaseConnectionEventEmitter.fire(event);
    }
}
