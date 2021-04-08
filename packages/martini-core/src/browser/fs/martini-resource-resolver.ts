import { MaybePromise, Resource, ResourceResolver } from "@theia/core/src/common";
import URI from "@theia/core/src/common/uri";
import { inject, injectable } from "inversify";
import { MartiniFileSystem } from "../../common/fs/martini-filesystem";

@injectable()
export class MartiniResourceResolver implements ResourceResolver {
    static readonly MARTINI_SCHEME = "martini";
    static readonly INMEMORY_SCHEME = "inmemory";

    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;

    resolve(uri: URI): MaybePromise<Resource> {
        if (uri.scheme === MartiniResourceResolver.MARTINI_SCHEME) return new MartiniResource(uri, this.fileSystem);
        if (uri.scheme === MartiniResourceResolver.INMEMORY_SCHEME) return new InMemoryTextResource(uri);
        throw new Error("The given URI is not a martini URI: " + uri);
    }
}

export class MartiniResource implements Resource {
    constructor(readonly uri: URI, readonly fileSystem: MartiniFileSystem) {}

    readContents(options?: { encoding?: string }): Promise<string> {
        return this.fileSystem.readContents(this.toPath(this.uri)).then(content => (content ? content : ""));
    }

    saveContents(content: string, options?: { encoding?: string }): Promise<void> {
        return this.fileSystem.saveContents(this.toPath(this.uri), content).then();
    }

    dispose(): void {
        // no-op
    }

    private toPath(uri: URI) {
        return this.uri.toString().replace("martini:/", "");
    }
}

export class InMemoryTextResource implements Resource {
    constructor(readonly uri: URI) {}

    async readContents(options?: { encoding?: string | undefined } | undefined): Promise<string> {
        return this.uri.query;
    }

    saveContents(content: string, options?: { encoding?: string }): Promise<void> {
        return Promise.resolve();
    }

    dispose(): void {
        // no-op
    }
}
