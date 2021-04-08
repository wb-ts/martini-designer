import { ContributionProvider } from "@theia/core";
import {
    ContextMenuRenderer,
    OpenerService,
    TreeProps
} from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { inject, injectable, named } from "inversify";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { MartiniFileSystem } from "../../common/fs/martini-filesystem";
import {
    AbstractTreeContentProvider,
    AbstractTreeLabelProvider,
    BaseTreeModel,
    OverlayIcon,
    TreeContentProvider,
    TreeLabelProvider
} from "../tree/base-tree";
import { BaseTreeWidget, DnDHandler, DragData, DropPosition } from "../tree/base-tree-widget";

export const NavigatorOpenHandler = Symbol("NavigatorOpenHandler");

export interface NavigatorOpenHandler {
    getUri: (element: any) => URI;
    canHandle: (element: any) => boolean;
}

@injectable()
export class Navigator extends BaseTreeWidget {
    static readonly ID = "martini-core:navigator";

    @inject(ContributionProvider)
    @named(NavigatorOpenHandler)
    private openHandlers: ContributionProvider<NavigatorOpenHandler>;

    constructor(
        @inject(TreeContentProvider)
        protected readonly treeContentProvider: TreeContentProvider,
        @inject(TreeLabelProvider)
        protected readonly treeLabelProvider: TreeLabelProvider,
        @inject(OpenerService) readonly openerService: OpenerService,
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
        this.id = Navigator.ID;
        this.title.label = messages.navigator;
        this.title.caption = messages.navigator;
        this.title.iconClass = "martini-tab-icon martini-server-icon";
        setTimeout(() => {
            this.model.input = new NavigatorRoot();
            this.update();
        }, 1000);
    }

    handleDoubleClick(element: any): boolean {
        const handler = this.openHandlers.getContributions().find(handler => handler.canHandle(element));
        if (handler) {
            const uri = handler.getUri(element);
            this.openerService.getOpener(uri).then(opener => opener.open(uri));
            return true;
        }

        return false;
    }
}

export const NavigatorContentProviderContribution = Symbol(
    "NavigatorContentProviderContribution"
);

export interface NavigatorContentProviderContribution
    extends TreeContentProvider {
    canHandle(element: any): boolean;
    priority: number;
}

export const NavigatorLabelProviderContribution = Symbol(
    "NavigatorLabelProviderContribution"
);

export interface NavigatorLabelProviderContribution extends TreeLabelProvider {
    canHandle(element: any): boolean;
    priority: number;
}

export class NavigatorRoot { }

@injectable()
export class NavigatorTreeContentProvider extends AbstractTreeContentProvider {
    @inject(MartiniFileSystem)
    fileSystem: MartiniFileSystem;
    readonly contributions: NavigatorContentProviderContribution[];

    constructor(
        @inject(ContributionProvider)
        @named(NavigatorContentProviderContribution)
        contributionProvider: ContributionProvider<
            NavigatorContentProviderContribution
        >
    ) {
        super();
        this.contributions = contributionProvider
            .getContributions()
            .sort((c1, c2) => c2.priority - c1.priority);
        this.contributions.forEach(contrib => {
            if (contrib.onDidUpdate)
                contrib.onDidUpdate(e => this.onDidUpdateEmitter.fire(e));
        });
    }

    async resolveChildren(parent: any): Promise<any[]> {
        const children = [];
        for (const contrib of this.contributions) {
            if (contrib.canHandle(parent)) {
                const result = await contrib.resolveChildren(parent);
                children.push(...result);
            }
        }

        return children;
    }

    hasChildren(parent: any): boolean {
        for (const contrib of this.contributions) {
            if (contrib.hasChildren(parent)) return true;
        }
        if (parent instanceof NavigatorRoot) return true;
        return false;
    }

    getParent(element: any) {
        for (const contrib of this.contributions) {
            const result = contrib.getParent(element);
            if (result) return true;
        }

        return undefined;
    }

    isEquals(element: any, other: any) {
        if (element instanceof NavigatorRoot && other instanceof NavigatorRoot)
            return true;
        for (const contrib of this.contributions) {
            if (contrib.isEqual) {
                const result = contrib.isEqual(element, other);
                if (result) return true;
            }
        }
        return false;
    }
}

@injectable()
export class NavigatorTreeLabelProvider extends AbstractTreeLabelProvider {
    readonly contributions: NavigatorLabelProviderContribution[];

    constructor(
        @inject(ContributionProvider)
        @named(NavigatorLabelProviderContribution)
        contributionProvider: ContributionProvider<
            NavigatorLabelProviderContribution
        >
    ) {
        super();
        this.contributions = contributionProvider
            .getContributions()
            .sort((c1, c2) => c2.priority - c1.priority);
        this.contributions.forEach(contrib => {
            if (contrib.onDidUpdate)
                contrib.onDidUpdate(e => this.onDidUpdateEmitter.fire(e));
        });
    }

    getCaption(element: any): string | React.ReactNode[] | undefined {
        for (const contrib of this.contributions) {
            if (contrib.canHandle(element)) {
                const caption = contrib.getCaption(element);
                if (caption) return caption;
            }
        }

        return undefined;
    }

    getIconClass(element: any): string | undefined {
        for (const contrib of this.contributions) {
            if (contrib.getIconClass && contrib.canHandle(element)) {
                const iconClass = contrib.getIconClass(element);
                if (iconClass) return iconClass;
            }
        }
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        const overlays: OverlayIcon[] = [];
        for (const contrib of this.contributions) {
            if (contrib.getOverlayIcons && contrib.canHandle(element)) {
                const icons = contrib.getOverlayIcons(element);
                if (icons) overlays.push(...icons);
            }
        }

        return overlays;
    }
}

@injectable()
export class NavigatorDnDHandler implements DnDHandler {

    isDraggable(_element: any): boolean {
        return true;
    }

    getDragData(_elements: any[]): DragData[] {
        return [];
    }

    async handleDrop(event: React.DragEvent<Element>, _target: any, _position: DropPosition): Promise<void> {
        event.dataTransfer.dropEffect = "none";
    }

}
