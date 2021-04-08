import { Disposable, DisposableCollection, Emitter, Event } from "@theia/core";
import {
    CompositeTreeNode,
    ExpandableTreeNode,
    SelectableTreeNode,

    TreeImpl,
    TreeModelImpl,
    TreeNode,
    TreeSelection
} from "@theia/core/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";

export interface DataTreeNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    data: any;
    resolved: boolean;
}

export namespace DataTreeNode {
    export function is(node: object | undefined): node is DataTreeNode {
        return !!node && "data" in node;
    }

    function generateId(): string {
        return (
            "_" +
            Math.random()
                .toString(36)
                .substr(2, 9)
        );
    }

    export function create(data: any, root: boolean = false): DataTreeNode {
        return {
            data,
            id: generateId(),
            name: "",
            selected: false,
            expanded: root,
            visible: !root,
            children: [],
            parent: undefined,
            resolved: false
        };
    }
}

export type TreeEvent = RefreshContentEvent | UpdateDataEvent;
export type RefreshContentEvent = any | ((element: any) => boolean);
export type UpdateDataEvent = {
    affects: (element: any) => boolean;
    update: (element: any) => any;
};

export namespace UpdateDataEvent {
    export function is(object: any) {
        return !!object && "affects" in object && "update" in object;
    }
}

export interface TreeContentProvider {
    resolveChildren(parent: any): Promise<any[]>;

    hasChildren(parent: any): boolean;

    getParent(element: any): any;

    isEqual?(element: any, other: any): boolean;

    dispose?(): void;

    onDidUpdate?: Event<TreeEvent>;
}

export const TreeContentProvider = Symbol("TreeContentProvider");

@injectable()
export abstract class AbstractTreeContentProvider implements TreeContentProvider {
    protected readonly onDidUpdateEmitter = new Emitter<TreeEvent>();
    readonly onDidUpdate = this.onDidUpdateEmitter.event;
    protected toDispose = new DisposableCollection();

    abstract resolveChildren(parent: any): Promise<any[]>;

    abstract hasChildren(parent: any): boolean;

    abstract getParent(element: any): any;

    dispose(): void {
        this.toDispose.dispose();
    }
}

export const TreeLabelProvider = Symbol("TreeLabelProvider");

export interface TreeLabelProvider {
    getCaption(element: any): string | React.ReactNode[] | undefined;

    getIconClass?(element: any): string | undefined;

    getOverlayIcons?(element: any): OverlayIcon[] | undefined;

    onDidUpdate?: Event<TreeEvent>;

    dispose?(): void;
}

@injectable()
export abstract class AbstractTreeLabelProvider implements TreeLabelProvider {
    protected readonly onDidUpdateEmitter = new Emitter<TreeEvent>();
    readonly onDidUpdate = this.onDidUpdateEmitter.event;
    protected toDispose = new DisposableCollection();

    abstract getCaption(element: any): string | React.ReactNode[] | undefined;

    dispose(): void {
        this.toDispose.dispose();
    }
}

export interface OverlayIcon {
    iconClass: string;
    width: number;
    height: number;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

@injectable()
export class BaseTree extends TreeImpl {
    @inject(TreeContentProvider) private treeContentProvider: TreeContentProvider;

    get allNodes(): TreeNode[] {
        return Object.values(this.nodes)
            .filter(e => e !== undefined)
            .map(e => e as TreeNode);
    }

    async resolveChildren(parent: DataTreeNode): Promise<TreeNode[]> {
        parent.resolved = true;
        const children = await this.treeContentProvider.resolveChildren(parent.data);

        if (parent.children.length === 0) {
            return children.map(child => DataTreeNode.create(child));
        } else {
            const nodes = parent.children.slice(0, children.length);
            for (let index = 0; index < children.length; index++) {
                const child = children[index];
                if (index >= nodes.length) nodes.push(DataTreeNode.create(child));
                else {
                    const node = nodes[index] as DataTreeNode;
                    if (!this.isEqual(child, node.data)) node.children = [];
                    node.data = child;
                }
            }
            return nodes;
        }
    }

    private isEqual(element: any, other: any): boolean {
        if (this.treeContentProvider.isEqual) return this.treeContentProvider.isEqual(element, other);
        return element === other;
    }
}

@injectable()
export class BaseTreeModel extends TreeModelImpl {
    @inject(TreeContentProvider) private treeContentProvider: TreeContentProvider;
    @inject(TreeLabelProvider) private treeLabelProvider: TreeLabelProvider;

    private onTreeSelectionChangedEmitter = new Emitter<ReadonlyArray<any>>();
    readonly onTreeSelectionChanged: Event<ReadonlyArray<any>> = this.onTreeSelectionChangedEmitter.event;
    private onOpenElementEmitter = new Emitter<any>();
    readonly onOpenElement = this.onOpenElementEmitter.event;
    private _waitForRefresh: Promise<void> = Promise.resolve();
    get waitForRefresh() {
        return this._waitForRefresh;
    }

    @postConstruct()
    init() {
        super.init();
        if (this.treeContentProvider.onDidUpdate) this.treeContentProvider.onDidUpdate(e => this.handleTreeEvent(e));
        if (this.treeLabelProvider.onDidUpdate) this.treeLabelProvider.onDidUpdate(e => this.handleTreeEvent(e));
        this.onSelectionChanged(_ => this.onTreeSelectionChangedEmitter.fire(this.selectedElements));
        if (Disposable.is(this.treeContentProvider)) this.toDispose.push(this.treeContentProvider);
        if (Disposable.is(this.treeLabelProvider)) this.toDispose.push(this.treeLabelProvider);

        this.onOpenNode(node => {
            if (DataTreeNode.is(node)) this.onOpenElementEmitter.fire(node.data);
        });
    }

    set input(input: any) {
        this.root = DataTreeNode.create(input, true);
    }

    setInputAndWait(input: any): Promise<void> {
        return new Promise(resolve => {
            const event = this.tree.onChanged(() => {
                event.dispose();
                resolve();
            });
            this.input = input;
        });
    }

    select(element: any) {
        const node = this.findNode(element);
        if (node !== undefined) this.selectNode(node);
    }

    async expand(element: any): Promise<void> {
        const node = this.findNode(element);
        if (node !== undefined) await this.expandNode(node);
        else throw new Error("Tree node not found for element: " + element.constructor?.name || typeof element);
    }

    async expandElements(predicate: (element: any) => boolean): Promise<void> {
        const root = this.root as DataTreeNode;
        await this.internalExpandNode(root, predicate);
    }

    async selectElements(predicate: (element: any) => boolean): Promise<void> {
        const selected = this.baseTree.allNodes.filter(node => DataTreeNode.is(node) && predicate(node.data));

        if (selected.length === 1) {
            this.selectNode(selected[0] as DataTreeNode);
        } else {
            selected.forEach((node, i) =>
                this.addSelection({
                    node: node as DataTreeNode,
                    type: i === 0 ? TreeSelection.SelectionType.DEFAULT : TreeSelection.SelectionType.TOGGLE
                })
            );
        }
    }

    async refreshElement(element: any): Promise<void> {
        if (element === this.rootData) {
            this._waitForRefresh = this.refresh().then();
            await this._waitForRefresh;
            return;
        } else {
            const node = this.findNode(element);
            if (node !== undefined) {
                this._waitForRefresh = this.refresh(node).then();
                await this._waitForRefresh;
                return;
            }
        }

        throw new Error("Tree node not found for element: " + element.constructor?.name || typeof element);
    }

    findNode(element: any): DataTreeNode | undefined {
        if (element === this.rootData) return this.root as DataTreeNode;

        for (const node of this.baseTree.allNodes) {
            if (DataTreeNode.is(node) && this.isEqual(element, node.data)) return node;
        }
    }

    get selectedElements(): any[] {
        return this.selectedNodes.filter(node => DataTreeNode.is(node)).map(node => (node as DataTreeNode).data);
    }

    get expandedElements(): any[] {
        return this.baseTree.allNodes
            .filter(node => node !== this.root && DataTreeNode.is(node) && node.expanded)
            .map(node => (node as DataTreeNode).data);
    }

    get rootData() {
        return (this.root as DataTreeNode).data;
    }

    get baseTree() {
        return this.tree as BaseTree;
    }

    private isEqual(element: any, other: any): boolean {
        if (this.treeContentProvider.isEqual) return this.treeContentProvider.isEqual(element, other);
        return element === other;
    }

    private handleTreeEvent(e: TreeEvent) {
        if (UpdateDataEvent.is(e)) {
            (this.tree as BaseTree).allNodes
                .filter(node => DataTreeNode.is(node) && e.affects(node.data))
                .forEach((node: DataTreeNode) => {
                    const data = e.update(node.data);
                    if (data !== undefined) node.data = data;
                });
            this.fireChanged();
        } else if (typeof e === "function") {
            (this.tree as BaseTree).allNodes
                .filter(node => DataTreeNode.is(node) && e(node.data))
                .forEach((node: DataTreeNode) => {
                    this.refresh(node);
                });
        } else this.refreshElement(e);
    }

    private async internalExpandNode(node: DataTreeNode, predicate: (element: any) => boolean): Promise<void> {
        if (node === this.root && !node.resolved) await this.expandNode(node);
        const children = node.children as DataTreeNode[];
        for (const child of children) {
            if (predicate(child.data)) {
                await this.expandNode(child);
                await this.internalExpandNode(child, predicate);
            }
        }
    }
}
