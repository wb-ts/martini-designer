import URI from "@theia/core/lib/common/uri";
import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";
import { codeDirResourceRegExp, withoutFileExtension } from "../../../common/fs/file-util";
import { Directory, MartiniFileSystem, Resource } from "../../../common/fs/martini-filesystem";
import { PartialMartiniPackage } from "../../../common/package/martini-package-manager";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution,
    NavigatorOpenHandler
} from "../../navigator/martini-navigator-view-widget";
import {
    AbstractTreeContentProvider,
    AbstractTreeLabelProvider,
    OverlayIcon,
    RefreshContentEvent
} from "../../tree/base-tree";
import { MartiniFileEventDispatcher } from "../martini-filesystem-event-dispatcher";
import { FilesystemPreferences } from "../pref/filesystem-preferences";

@injectable()
export class FileSystemNavigatorContentProvider
    extends AbstractTreeContentProvider
    implements NavigatorContentProviderContribution {
    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;
    @inject(MartiniFileEventDispatcher)
    private readonly fileEventDispatcher: MartiniFileEventDispatcher;

    readonly priority = 0;
    flattenCodeDirectories: boolean = true;

    @postConstruct()
    init() {
        this.toDispose.push(this.fileEventDispatcher.onFileEvent(e => {
            if (e.action !== "MODIFIED") {
                this.onDidUpdateEmitter.fire(
                    (element: any) =>
                        Resource.is(element) &&
                        (e.paths.find(path =>
                            path.startsWith(element.location)
                        ) as RefreshContentEvent)
                );
            }
        }));
    }

    canHandle(element: any): boolean {
        return (
            PartialMartiniPackage.is(element) ||
            Directory.is(element) ||
            FlattenDirectory.is(element)
        );
    }

    async resolveChildren(parent: any): Promise<any[]> {
        if (PartialMartiniPackage.is(parent)) {
            const packageName = parent.name;
            const resource = await this.fileSystem.get(`/${packageName}`);
            if (Directory.is(resource)) return resource.children.sort((r1, r2) => {
                if (r1.name === "code" && r2.name !== "code") return -1;
                if (r1.name !== "code" && r2.name === "code") return 1;
                return r1.name.localeCompare(r2.name);
            });
        }

        if (FlattenDirectory.is(parent))
            return await this.resolveChildren(
                parent.directories[parent.directories.length - 1]
            );

        if (Directory.is(parent)) {
            const resource = await this.fileSystem.get(parent.location);
            if (Directory.is(resource)) {
                if (this.flattenCodeDirectories) {
                    return Promise.all(
                        this.getSortedChildren(resource).map(async child => {
                            if (Directory.is(child)) {
                                let next = (await this.fileSystem.get(
                                    child.location
                                )) as Resource;
                                const dirs = [];
                                while (
                                    Directory.is(next) &&
                                    !Directory.containsFiles(next) &&
                                    next.children.length === 1
                                ) {
                                    dirs.push(next);
                                    next = (await this.fileSystem.get(
                                        next.children[0].location
                                    )) as Directory;
                                }

                                dirs.push(next);

                                if (dirs.length > 1)
                                    return { ...dirs[dirs.length - 1], directories: dirs } as FlattenDirectory;

                                return child;
                            }
                            return child;
                        })
                    );
                } else if (Directory.is(resource))
                    return this.getSortedChildren(resource);
            }
        }

        return [];
    }

    hasChildren(parent: any): boolean {
        if (PartialMartiniPackage.is(parent)) return parent.status !== "UNLOADED";
        return Directory.is(parent) || FlattenDirectory.is(parent);
    }

    getParent(element: any) {
    }

    private getSortedChildren(directory: Directory) {
        return directory.children.sort((r1, r2) => {
            if ((r1.directory && r2.directory) || (!r1.directory && !r2.directory))
                return r1.name.localeCompare(r2.name);

            return r1.directory ? -1 : 1;
        });
    }
}

@injectable()
export class FileSystemNavigatorLabelProvider extends AbstractTreeLabelProvider
    implements NavigatorLabelProviderContribution {
    priority = 0;

    @inject(FilesystemPreferences)
    private readonly fsPref: FilesystemPreferences;

    @postConstruct()
    protected init() {
        this.toDispose.push(this.fsPref.onPreferenceChanged(e => {
            if (e.preferenceName === "navigator.hideFileExtensions")
                this.onDidUpdateEmitter.fire(undefined);
        }));
    }

    canHandle(element: any): boolean {
        return Resource.is(element) || FlattenDirectory.is(element);
    }

    getCaption(element: any): string | React.ReactNode[] | undefined {
        if (FlattenDirectory.is(element))
            return element.directories.map((dir, i) => (
                <React.Fragment key={i}>
                    <span
                        title={dir.location}
                        className="martini-code-directory-fragment"
                        key={dir.location}
                    >
                        {dir.name}
                    </span>
                    {i + 1 < element.directories.length && <span key={i}>/</span>}
                </React.Fragment>
            ));
        if (Resource.is(element)) {
            let name = element.name;
            if (element.location.match(/^\/core\/code$/)) name = "models";
            if (this.fsPref["navigator.hideFileExtensions"] && !element.directory && codeDirResourceRegExp.test(element.location))
                name = withoutFileExtension(name);

            return [
                <span key="resource-name" title={element.location}>
                    {name}
                </span>
            ];
        }
    }

    getIconClass(element: any): string | undefined {
        if (FlattenDirectory.is(element))
            return this.getIconClass(
                element.directories[element.directories.length - 1]
            );
        if (Directory.is(element)) {
            if (element.location.match(/\/[\w\d_-]{1,50}\/code\/.+/))
                return "martini-tree-icon martini-code-directory-icon";
            return "martini-tree-icon martini-directory-icon";
        }
        if (Resource.isFile(element)) {
            if (element.location.endsWith(".groovy"))
                return "martini-tree-icon martini-groovy-icon";
            return "martini-tree-icon martini-file-icon";
        }
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        if (
            Directory.is(element) &&
            element.location.match(/^\/[\w\d_-]{1,50}\/code$/)
        )
            return [
                {
                    width: 7,
                    height: 8,
                    iconClass: "martini-code-directory-overlay-icon",
                    position: "top-right"
                }
            ];
        if (
            Directory.is(element) &&
            element.location.match(/\/core\/queries$/)
        )
            return [
                {
                    width: 7,
                    height: 8,
                    iconClass: "martini-query-directory-overlay-icon",
                    position: "top-right"
                }
            ];
    }
}

export interface FlattenDirectory extends Directory {
    directories: Directory[];
}

export namespace FlattenDirectory {
    export function is(object: any): object is FlattenDirectory {
        return !!object && typeof object === "object" && "directories" in object;
    }
}

@injectable()
export class FilesystemNavigatorOpenHandler implements NavigatorOpenHandler {
    getUri(element: any): URI {
        const resource = element as Resource;
        return new URI("martini:/" + resource.location);
    }
    canHandle(element: any): boolean {
        return Resource.is(element) && !element.directory;
    }
}
