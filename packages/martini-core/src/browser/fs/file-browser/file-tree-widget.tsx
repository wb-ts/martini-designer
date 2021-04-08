import { ContextMenuRenderer, TreeProps } from "@theia/core/lib/browser";
import { inject, injectable, interfaces, postConstruct } from "inversify";
import { v4 as uuid } from "uuid";
import { Resource } from "../../../common/fs/martini-filesystem";
import { PartialMartiniPackage } from "../../../common/package/martini-package-manager";
import { NavigatorRoot } from "../../navigator/martini-navigator-view-widget";
import {
    PackageNavigatorContentProvider,
    PackageNavigatorLabelProvider
} from "../../package/package-navigator-contribution";
import {
    AbstractTreeContentProvider,
    AbstractTreeLabelProvider,
    BaseTreeModel,
    OverlayIcon,
    TreeContentProvider,
    TreeLabelProvider
} from "../../tree/base-tree";
import createBaseTreeContainer from "../../tree/base-tree-container";
import { BaseTreeWidget } from "../../tree/base-tree-widget";
import {
    FileSystemNavigatorContentProvider,
    FileSystemNavigatorLabelProvider
} from "../filesystem-navigator-contribution";

@injectable()
export class FileTreeWidget extends BaseTreeWidget {
    constructor(
        @inject(TreeContentProvider)
        readonly treeContentProvider: FileTreeContentProvider,
        @inject(TreeLabelProvider)
        protected readonly treeLabelProvider: TreeLabelProvider,
        @inject(TreeProps) readonly props: TreeProps,
        @inject(BaseTreeModel) readonly model: BaseTreeModel,
        @inject(ContextMenuRenderer)
        protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(
            treeContentProvider,
            treeLabelProvider,
            props,
            model,
            contextMenuRenderer
        );
        this.id = uuid();
        setTimeout(() => {
            this.model.input = new NavigatorRoot();
            this.update();
        }, 1000);
    }

}

export type ResourceFilter = (resource: Resource) => boolean;

@injectable()
class FileTreeContentProvider extends AbstractTreeContentProvider {

    @inject(PackageNavigatorContentProvider)
    private packageContentProvider: PackageNavigatorContentProvider;
    @inject(FileSystemNavigatorContentProvider)
    private fsContentProvider: FileSystemNavigatorContentProvider;
    resourceFilter: ResourceFilter | undefined;

    @postConstruct()
    protected init() {
        this.fsContentProvider.flattenCodeDirectories = false;
        this.toDispose.pushAll([this.packageContentProvider, this.fsContentProvider]);
    }

    async resolveChildren(parent: any): Promise<any[]> {
        if (this.packageContentProvider.canHandle(parent)) {
            const packages = await this.packageContentProvider.resolveChildren(parent);
            return packages
                .filter(child => PartialMartiniPackage.is(child))
                .filter(pckage => pckage.name !== "core")
                .filter(pckage => pckage.status !== "UNLOADED");
        }
        if (this.fsContentProvider.canHandle(parent)) {
            const resources = await this.fsContentProvider.resolveChildren(parent);
            if (this.resourceFilter)
                return resources.filter(Resource.is).filter(res => this.resourceFilter!(res));
            return resources;
        }
        return [];
    }

    getParent(element: any): any {
        if (this.packageContentProvider.canHandle(element))
            return this.packageContentProvider.getParent(element);
        if (this.fsContentProvider.canHandle(element))
            return this.fsContentProvider.getParent(element);
    }

    hasChildren(parent: any): boolean {
        if (this.packageContentProvider.canHandle(parent))
            return this.packageContentProvider.hasChildren(parent);
        if (this.fsContentProvider.canHandle(parent))
            return this.fsContentProvider.hasChildren(parent);
        return false;
    }
}

@injectable()
class FileTreeLabelProvider extends AbstractTreeLabelProvider {
    @inject(PackageNavigatorLabelProvider)
    private readonly packageLabelProvider: PackageNavigatorLabelProvider;
    @inject(FileSystemNavigatorLabelProvider)
    private readonly fsLabelProvider: FileSystemNavigatorLabelProvider;

    @postConstruct()
    protected init() {
        this.toDispose.pushAll([this.packageLabelProvider, this.fsLabelProvider]);
    }

    getCaption(element: any): string | React.ReactNode[] | undefined {
        if (this.packageLabelProvider.canHandle(element))
            return this.packageLabelProvider.getCaption(element);
        if (this.fsLabelProvider.canHandle(element))
            return this.fsLabelProvider.getCaption(element);
        return undefined;
    }

    getIconClass(element: any): string | undefined {
        if (this.packageLabelProvider.canHandle(element))
            return this.packageLabelProvider.getIconClass(element);
        if (this.fsLabelProvider.canHandle(element))
            return this.fsLabelProvider.getIconClass(element);
        return undefined;
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        if (this.packageLabelProvider.canHandle(element))
            return this.packageLabelProvider.getOverlayIcons(element);
        if (this.fsLabelProvider.canHandle(element))
            return this.fsLabelProvider.getOverlayIcons(element);
        return undefined;
    }

}

export const createFileTreeContainer = (
    parent: interfaces.Container
): interfaces.Container => {
    const child = createBaseTreeContainer(parent);
    child.bind(TreeContentProvider).to(FileTreeContentProvider);
    child.bind(TreeLabelProvider).to(FileTreeLabelProvider);
    child.bind(FileTreeWidget).toSelf();
    return child;
};
