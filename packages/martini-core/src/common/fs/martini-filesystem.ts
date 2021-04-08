import { JsonRpcServer } from "@theia/core";
import { MartiniEvent } from "../event/martini-event";

export interface Resource {
    name: string;
    location: string;
    directory: boolean;
    lastModified: number;
    size: number;
    readOnly: boolean;
}

export namespace Resource {
    export function is(object: any): object is Resource {
        return (
            !!object &&
            typeof object === "object" &&
            "name" in object &&
            "location" in object &&
            "directory" in object &&
            "lastModified" in object &&
            "size" in object &&
            "readOnly" in object
        );
    }

    export function isFile(object: any): object is Resource {
        return Resource.is(object) && !object.directory;
    }
}

export interface Directory extends Resource {
    children: Resource[];
}

export namespace Directory {
    export function is(object: any): object is Directory {
        return Resource.is(object) && object.directory && "children" in object;
    }

    export function containsFiles(dir: Directory) {
        return dir.children.find(r => !r.directory);
    }
}

export const martiniFileSystemPath = "/services/martini/filesystem";

export const MartiniFileSystem = Symbol("MartiniFileSystem");

export interface MartiniFileSystem extends JsonRpcServer<MartiniFileSystemClient> {
    get(path: string): Promise<Resource | undefined>;

    exists(path: string): Promise<boolean>;

    readContents(path: string): Promise<string | undefined>;

    saveContents(path: string, contents: string): Promise<boolean>;

    makeDir(path: string): Promise<void>;

    delete(path: string): Promise<boolean>;

    rename(path: string, newName: string): Promise<void>;
}

export interface MartiniFileEvent extends MartiniEvent {
    action: "ADDED" | "MODIFIED" | "DELETED";
    paths: string[];
}

export namespace MartiniFileEvent {
    export function is(event: MartiniEvent): event is MartiniFileEvent {
        return event.type == "FILE";
    }
}

export interface FileInfo {
    path: string;
    created: number;
    lastAccessed: number;
}

export interface MartiniFileSystemClient {
    onEvent(event: MartiniFileEvent): void;
}
