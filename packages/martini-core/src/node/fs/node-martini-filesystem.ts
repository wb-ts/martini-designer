import { Path } from "@theia/core";
import { inject, injectable, postConstruct } from "inversify";
import {
    Directory,
    MartiniFileEvent,
    MartiniFileSystem,
    MartiniFileSystemClient,
    Resource
} from "../../common/fs/martini-filesystem";
import { MartiniEventDispatcher } from "../event/martini-event-manager";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class MartiniFileSystemNode implements MartiniFileSystem {
    @inject(MartiniEventDispatcher)
    private readonly eventDispatcher: MartiniEventDispatcher;
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    // @ts-ignore
    private client: MartiniFileSystemClient | undefined;

    @postConstruct()
    init() {
        this.eventDispatcher.onEvent(event => {
            if (MartiniFileEvent.is(event)) this.client?.onEvent(event);
        });
    }

    async get(path: string): Promise<Resource | undefined> {
        try {
            if (!path.startsWith("/")) path = "/" + path;
            const response = await (await this.axiosFactory.make()).get(`/coder-api/getFiles${path}`);

            if (response.status !== 200) return undefined;

            return this.parseResource(response.data);
        } catch (error) {
            if (error.response.status === 404) return undefined;
        }
    }

    async exists(path: string): Promise<boolean> {
        const resource = await this.get(path);
        return resource !== undefined;
    }

    async readContents(path: string): Promise<string | undefined> {
        if (!path.startsWith("/")) path = "/" + path;
        const response = await (await this.axiosFactory.make()).get(`/coder-api/openFile${path}`, {
            responseType: "arraybuffer"
        });

        if (response.status !== 200) return undefined;

        return Buffer.from(response.data).toString();
    }

    async saveContents(path: string, contents: string): Promise<boolean> {
        if (!path.startsWith("/")) path = "/" + path;
        const response = await (await this.axiosFactory.make()).post(`/coder-api/saveFile${path}`, contents, {
            headers: {
                "Content-Type": "application/octet-stream"
            }
        });

        return response.status === 200;
    }

    async makeDir(path: string): Promise<void> {
        if (!path.startsWith("/")) path = "/" + path;
        await (await this.axiosFactory.make()).post(`/coder-api/createDirectory${path}`);
    }

    async delete(path: string): Promise<boolean> {
        if (!path.startsWith("/")) path = "/" + path;
        const response = await (await this.axiosFactory.make()).delete(`/coder-api/deleteFile${path}`);
        return response.status === 200;
    }

    async rename(path: string, newName: string): Promise<void> {
        if (!path.startsWith("/")) path = "/" + path;
        const newPath = new Path(path).dir.join(newName);
        await (await this.axiosFactory.make()).post(`/coder-api/moveFile${path}`, undefined, {
            params: {
                newLocation: newPath.toString(),
                fixReferences: true
            }
        });
    }

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    setClient(client: MartiniFileSystemClient | undefined): void {
        this.client = client;
    }

    private parseResource(json: any): Resource | Directory {
        if (json.type === "directory") {
            return {
                name: json.name,
                location: json.location,
                directory: true,
                lastModified: json.lastModified,
                size: json.size,
                readOnly: json.readOnly,
                children: [
                    ...json.directories.map((dir: any) => this.parseResource(dir)),
                    ...json.files.map((file: any) => this.parseResource(file))
                ]
            };
        }

        return {
            name: json.name,
            location: json.location,
            directory: false,
            lastModified: json.lastModified,
            size: json.size,
            readOnly: json.readOnly
        };
    }
}
