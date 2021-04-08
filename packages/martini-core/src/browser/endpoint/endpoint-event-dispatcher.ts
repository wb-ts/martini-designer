import {Emitter, Event} from "@theia/core";
import {injectable} from "inversify";
import {EndpointEvent, MartiniEndpointManagerClient} from "../../common/endpoint/martini-endpoint-manager";

export const EndpointEventDispatcher = Symbol("EndpointEventDispatcher");

export interface EndpointEventDispatcher {
    onEndpointEvent: Event<EndpointEvent>;
}

@injectable()
export class EndpointEventDispatcherClient
    implements MartiniEndpointManagerClient, EndpointEventDispatcher {
    private readonly onEndpointEventEmitter = new Emitter<EndpointEvent>();
    readonly onEndpointEvent = this.onEndpointEventEmitter.event;

    onEvent(event: EndpointEvent): void {
        this.onEndpointEventEmitter.fire(event);
    }
}
