import { Emitter, Event } from "@theia/core";
import { injectable } from "inversify";
import { MartiniPackageEvent, MartiniPackageManagerClient } from "../../common/package/martini-package-manager";

export const MartiniPackageEventDispatcher = Symbol("MartiniPackageEventDispatcher");

export interface MartiniPackageEventDispatcher {
    onPackageEvent: Event<MartiniPackageEvent>;
}

@injectable()
export class MartiniPackageEventDispatcherClient implements MartiniPackageManagerClient, MartiniPackageEventDispatcher {
    private readonly onPackageEventEmitter = new Emitter<MartiniPackageEvent>();
    readonly onPackageEvent = this.onPackageEventEmitter.event;

    onEvent(event: MartiniPackageEvent): void {
        this.onPackageEventEmitter.fire(event);
    }
}
