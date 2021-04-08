import { Emitter, Event } from "@theia/core";
import { injectable } from "inversify";
import { MartiniFileEvent, MartiniFileSystemClient } from "../../common/fs/martini-filesystem";

export const MartiniFileEventDispatcher = Symbol("MartiniFileEventDispatcher");

export interface MartiniFileEventDispatcher {
    onFileEvent: Event<MartiniFileEvent>;
}

@injectable()
export class MartiniFileSystemEventDispatcherClient implements MartiniFileSystemClient, MartiniFileEventDispatcher {
    private readonly onFileEventEmitter = new Emitter<MartiniFileEvent>();
    readonly onFileEvent = this.onFileEventEmitter.event;

    onEvent(event: MartiniFileEvent): void {
        this.onFileEventEmitter.fire(event);
    }
}
