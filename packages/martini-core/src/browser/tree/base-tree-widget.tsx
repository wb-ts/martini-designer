import { Disposable, DisposableCollection, Emitter, MenuPath } from "@theia/core";
import {
    COLLAPSED_CLASS, ContextMenuRenderer,
    ExpandableTreeNode,
    EXPANSION_TOGGLE_CLASS, NodeProps,
    SelectableTreeNode,
    TreeDecoration,
    TreeNode,
    TreeProps,
    TreeWidget,
    TREE_NODE_CONTENT_CLASS, TREE_NODE_INDENT_GUIDE_CLASS, TREE_NODE_SEGMENT_CLASS
} from "@theia/core/lib/browser";
import { inject, injectable, multiInject, optional } from "inversify";
import * as React from "react";
import * as ReactDOM from 'react-dom';
import { TextHighlighter } from "../components/text-highlighter";
import { LocalDnDTransfer } from "../dnd/local-dnd-transfer";
import { BaseTreeModel, DataTreeNode, OverlayIcon, TreeContentProvider, TreeLabelProvider } from "./base-tree";
import { TreeEditor } from "./tree-editor";
import { CustomSearchBox } from "./tree-search-box";

export type DropPosition = "before" | "on" | "after";

export type DragData = {
    format: string;
    data: string;
};

export const DnDHandler = Symbol("DnDHandler");

export interface DnDHandler {

    isDraggable(element: any): boolean;

    getDragData(elements: any[]): DragData[];

    handleDrop(event: React.DragEvent, target: any, position: DropPosition): Promise<void>;

}

export const GutterColumn = Symbol("GutterColumn");
export interface GutterColumn {
    width: number;
    order: number;
    computeWidth(visibleElements: any[]): void;
    render(element: any): React.ReactNode;
    onDoubleClick?(element: any, event: MouseEvent): void;
}

@injectable()
export class BaseTreeWidget extends TreeWidget {

    @inject(LocalDnDTransfer)
    protected localDnDTransfer: LocalDnDTransfer;
    @inject(DnDHandler)
    @optional()
    protected dndHandler: DnDHandler | undefined;
    @inject(TreeEditor)
    @optional()
    protected treeEditor: TreeEditor | undefined;
    @multiInject(GutterColumn)
    @optional()
    protected gutterColumns: GutterColumn[];

    protected readonly toCancelNodeExpansion = new DisposableCollection();
    protected dropTargetNode: TreeNode | undefined;
    protected dropPosition: DropPosition | undefined;
    excludedDropPositionFeedback: Exclude<DropPosition, "on">[] = [];
    protected editedNode: DataTreeNode | undefined;
    protected editedNodeProperty: string | undefined;
    protected searchText: string | undefined;

    private readonly onRenderedEmitter = new Emitter<void>();
    readonly onRendered = this.onRenderedEmitter.event;
    private readonly onDragStartEmitter = new Emitter<any[]>();
    readonly onDragStart = this.onDragStartEmitter.event;
    private readonly onDragEndEmitter = new Emitter<void>();
    readonly onDragEnd = this.onDragEndEmitter.event;

    private enterKeyDown = false;

    protected gutterWidth = 0;
    protected gutterPadding = 0;
    protected gutterContextMenuPath: MenuPath | undefined;
    protected visibleGutterColumns: GutterColumn[] = [];

    constructor(
        @inject(TreeContentProvider)
        protected readonly treeContentProvider: TreeContentProvider,
        @inject(TreeLabelProvider)
        protected readonly treeLabelProvider: TreeLabelProvider,
        @inject(TreeProps) readonly props: TreeProps,
        @inject(BaseTreeModel) readonly model: BaseTreeModel,
        @inject(ContextMenuRenderer)
        protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(props, model, contextMenuRenderer);
        if (treeLabelProvider.onDidUpdate)
            this.toDispose.push(treeLabelProvider.onDidUpdate(() => this.update()));
        if (treeContentProvider.onDidUpdate)
            this.toDispose.push(
                treeContentProvider.onDidUpdate(() => this.update())
            );
        this.toDispose.push(this.toCancelNodeExpansion);
        if (props.contextMenuPath)
            this.gutterContextMenuPath = [...props.contextMenuPath, "gutter"];
    }

    protected init(): void {
        super.init();
        this.node.addEventListener("keyup", e => {
            if (e.key === "Enter") this.handleEnter(e);
        });
        if (this.props.search) {
            this.toDispose.pushAll([
                this.searchBox.onTextChange(searchText => this.searchText = searchText),
                this.searchBox.onClose(() => {
                    this.activate();
                    (this.searchBox as CustomSearchBox).totalMatches = -1;
                }),
                this.treeSearch.onFilteredNodesChanged(e => {
                    (this.searchBox as CustomSearchBox).totalMatches = this.treeSearch.filteredNodes.length;
                })
            ]);
        }
    }

    forceRender(): Promise<void> {
        return new Promise(resolve => {
            this.doUpdateRows();
            ReactDOM.render(<React.Fragment>{this.render()}</React.Fragment>, this.node, resolve);
        });
    }

    protected handleDblClickEvent(
        node: TreeNode | undefined,
        event: React.MouseEvent<HTMLElement>
    ): void {
        const element = DataTreeNode.is(node) ? node.data : undefined;
        let handled = false;

        if (element && this.handleDoubleClick(element, event))
            handled = true;

        if (!handled && this.treeEditor && element && this.treeEditor.canEdit(element)) {
            handled = true;
            this.editNode(node as DataTreeNode);
        }

        if (!handled) this.model.openNode(node);

        if (handled) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    protected handleClickEvent(
        node: TreeNode | undefined,
        event: React.MouseEvent<HTMLElement>
    ): void {
        if (node) {
            if (!!this.props.multiSelect) {
                const shiftMask = this.hasShiftMask(event);
                const ctrlCmdMask = this.hasCtrlCmdMask(event);
                if (SelectableTreeNode.is(node)) {
                    if (shiftMask) {
                        this.model.selectRange(node);
                    } else if (ctrlCmdMask) {
                        this.model.toggleNode(node);
                    } else {
                        this.model.selectNode(node);
                    }
                }

                if (
                    this.isExpandable(node) &&
                    !shiftMask &&
                    !ctrlCmdMask &&
                    event.currentTarget.className.includes("ExpansionToggle")
                ) {
                    this.model.toggleNodeExpansion(node);
                }
            } else {
                if (SelectableTreeNode.is(node)) {
                    this.model.selectNode(node);
                }
                if (
                    event.currentTarget.className.includes("ExpansionToggle") &&
                    this.isExpandable(node) &&
                    !this.hasCtrlCmdMask(event) &&
                    !this.hasShiftMask(event)
                ) {
                    this.model.toggleNodeExpansion(node);
                }
            }
            event.stopPropagation();
        }
    }

    protected handleGutterClickEvent(
        node: TreeNode | undefined,
        event: React.MouseEvent<HTMLElement>
    ) {
        if (event.button === 0)
            this.handleClickEvent(node, event);
    }

    protected handleGutterDoubleClickEvent(
        node: TreeNode | undefined,
        gutterColumn: GutterColumn,
        event: React.MouseEvent<HTMLElement>
    ) {
        if (gutterColumn.onDoubleClick) {
            gutterColumn.onDoubleClick((node as DataTreeNode).data, event.nativeEvent);
            event.preventDefault();
            event.stopPropagation();
        }
    }

    protected handleGutterContextMenuEvent(
        node: TreeNode | undefined,
        event: React.MouseEvent<HTMLElement>
    ) {
        if (this.gutterContextMenuPath) {
            event.stopPropagation();
            event.preventDefault();
            this.handleClickEvent(node, event);
            this.contextMenuRenderer.render({
                anchor: event.nativeEvent,
                menuPath: this.gutterContextMenuPath
            });
        }
    }

    protected handleEnter(event: KeyboardEvent): void {
        if (this.editedNode)
            return;

        const selection = this.model.selectedNodes[0];
        if (this.treeEditor && selection &&
            DataTreeNode.is(selection) &&
            this.treeEditor.canEdit(selection.data)) {
            event.stopPropagation();
            event.preventDefault();
            if (event.type === "keyup" && this.enterKeyDown) {
                this.enterKeyDown = false;
                this.editNode(selection);
            }
            else if (event.type === "keydown")
                this.enterKeyDown = true;
            return;
        }
        else
            super.handleEnter(event);
    }

    protected handleDown(event: KeyboardEvent): void {
        if (this.editedNode) {
            event.target?.dispatchEvent(event);
            return;
        }

        super.handleDown(event);
    }

    protected handleUp(event: KeyboardEvent): void {
        if (this.editedNode) {
            event.target?.dispatchEvent(event);
            return;
        }

        super.handleUp(event);
    }

    protected handleLeft(event: KeyboardEvent): Promise<void> {
        if (this.editedNode) {
            event.target?.dispatchEvent(event);
            return Promise.resolve();
        }

        return super.handleLeft(event);
    }

    protected handleRight(event: KeyboardEvent): Promise<void> {
        if (this.editedNode) {
            event.target?.dispatchEvent(event);
            return Promise.resolve();
        }

        return super.handleRight(event);
    }

    protected handleDoubleClick(element: any, event: React.MouseEvent<HTMLElement>): boolean {
        return false;
    }

    protected editNode(node: DataTreeNode, property?: string): void {
        if (!this.treeEditor || !this.treeEditor.canEdit(node.data, property))
            return;
        this.editedNodeProperty = property;
        this.editedNode = node;
        this.update();
    }

    editElement(element: any, property?: string): void {
        const node = this.model.findNode(element);
        if (node)
            this.editNode(node, property);
    }

    cancelEditing(): void {
        this.editedNodeProperty = undefined;
        this.editedNode = undefined;
        this.update();
        this.activate();
    }

    storeState(): object {
        return {};
    }

    restoreState(oldState: object) {
        // no-op
    }

    showSearchBox() {
        if (this.searchBox) {
            this.searchBox.show();
            this.searchBox.activate();
            if (this.searchBox instanceof CustomSearchBox)
                this.searchBox.focusInput(true);
        }
    }

    protected updateGlobalSelection() {
        const selection = this.model.selectedElements;
        Object.assign(selection, { source: this });
        this.selectionService.selection = selection;
    }

    protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
        if (DataTreeNode.is(node)) {
            if (node.resolved) return node.children.length > 0;
            return this.treeContentProvider.hasChildren(node.data);
        }
        return super.isExpandable(node);
    }

    /**
     * Actually render the node row.
     */
    protected doRenderNodeRow({ index, node, depth }: TreeWidget.NodeRow): React.ReactNode {
        return <React.Fragment>
            {this.renderGutter(node)}
            {this.renderIndent(node, { depth })}
            {this.renderNode(node, { depth })}
        </React.Fragment>;
    }

    protected renderGutter(node: TreeNode): React.ReactNode {
        if (!this.gutterWidth)
            return undefined;

        return <div
            data-node-id={node.id}
            onClick={e => this.handleGutterClickEvent(node, e)}
            onContextMenu={e => this.handleGutterContextMenuEvent(node, e)}
            style={{
                position: "absolute",
                display: "grid",
                gridTemplateColumns: this.visibleGutterColumns.map(col => col.width + "px").join(" "),
                height: "var(--theia-content-line-height)",
                width: this.gutterWidth,
                gridColumnGap: "4px"
            }}
        >
            {this.visibleGutterColumns.map((col, i) => (
                <div
                    key={i}
                    style={{
                        width: col.width,
                        maxWidth: col.width,
                        display: "grid",
                        alignItems: "center",
                    }}
                    onDoubleClick={e => this.handleGutterDoubleClickEvent(node, col, e)}
                >
                    {col.render((node as DataTreeNode).data)}
                </div>
            ))}
        </div>;
    }

    /**
     * Render indent for the file tree based on the depth
     * @param node the tree node.
     * @param depth the depth of the tree node.
     */
    protected renderIndent(node: TreeNode, props: NodeProps): React.ReactNode {
        const renderIndentGuides = this.corePreferences['workbench.tree.renderIndentGuides'];
        if (renderIndentGuides === 'none') {
            return undefined;
        }

        const indentDivs: React.ReactNode[] = [];
        let current: TreeNode | undefined = node;
        let depth = props.depth;
        while (current && depth) {
            const classNames: string[] = [TREE_NODE_INDENT_GUIDE_CLASS];
            if (this.needsActiveIndentGuideline(current)) {
                classNames.push('active');
            } else {
                classNames.push(renderIndentGuides === 'onHover' ? 'hover' : 'always');
            }
            const paddingLeft = this.gutterWidth + this.props.leftPadding * depth;
            indentDivs.unshift(<div key={depth} className={classNames.join(' ')} style={{
                paddingLeft: `${paddingLeft}px`
            }} />);
            current = current.parent;
            depth--;
        }
        return indentDivs;
    }

    /**
     * Render the node given the tree node and node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    protected renderNode(node: TreeNode, props: NodeProps): React.ReactNode {
        if (!TreeNode.isVisible(node)) {
            return undefined;
        }
        const attributes = this.createNodeAttributes(node, props);

        const classNames = [TREE_NODE_CONTENT_CLASS];

        if (node === this.dropTargetNode && this.dropPosition)
            classNames.push("tree-node-drop-" + this.dropPosition);

        const content = <div className={classNames.join(" ")}>
            {this.renderExpansionToggle(node, props)}
            {this.decorateIcon(node, this.renderIcon(node, props))}
            {this.renderCaptionAffixes(node, props, 'captionPrefixes')}
            {this.renderCaption(node, props)}
            {this.renderCaptionAffixes(node, props, 'captionSuffixes')}
            {this.renderTailDecorations(node, props)}
        </div>;
        return React.createElement('div', attributes, content);
    }

    protected toReactNode(caption: string, highlight: TreeDecoration.CaptionHighlight): React.ReactNode[] {
        if (!caption)
            return [];
        return super.toReactNode(caption, highlight);
    }

    protected render() {
        setTimeout(() => this.onRenderedEmitter.fire());
        this.updateGutter();
        return super.render();
    }

    protected renderCaption(node: TreeNode, props: NodeProps): React.ReactNode {
        if (this.editedNode && this.treeEditor && node.id === this.editedNode.id) {
            return this.treeEditor.getCellEditor(this.editedNode.data, this.editedNodeProperty, () => this.cancelEditing());
        }

        if (DataTreeNode.is(node)) {
            const highlight = this.searchHighlights?.get(node.id);
            const base = super.renderCaption(node, props) as React.ReactElement;
            const children: React.ReactNode[] = [base.props.children];

            const caption = this.treeLabelProvider.getCaption(node.data);
            if (caption instanceof Array) children.push(...caption);
            else children.push(caption);

            if (highlight)
                return <TextHighlighter search={this.searchText}>
                    <div {...base.props}>{children}</div>
                </TextHighlighter>;
            else
                return <div {...base.props}>{children}</div>;
        }

        return super.renderCaption(node, props);
    }

    protected renderIcon(node: TreeNode, props: NodeProps): React.ReactNode {
        if (DataTreeNode.is(node) && this.treeLabelProvider.getIconClass) {
            const iconClass = this.treeLabelProvider.getIconClass(node.data);

            if (!iconClass) return <div></div>;

            const overlayIcons: OverlayIcon[] = [];

            if (this.treeLabelProvider.getOverlayIcons) {
                const _overlayIcons = this.treeLabelProvider.getOverlayIcons(node.data);
                if (_overlayIcons) overlayIcons.push(..._overlayIcons);
            }

            return (
                <div
                    className={iconClass}
                    style={{ position: "relative", marginRight: "4px" }}
                >
                    {overlayIcons.map((overlay, i) => renderOverlayIcon(overlay, i))}
                </div>
            );
        }
        return super.renderIcon(node, props);
    }

    protected renderExpansionToggle(node: TreeNode, props: NodeProps): React.ReactNode {
        if (!this.isExpandable(node)) {
            // eslint-disable-next-line no-null/no-null
            return <div
                data-node-id={node.id}
                style={{ width: "4px" }}
                className={`${TREE_NODE_SEGMENT_CLASS}`} >
            </div>;
        }

        if (node.busy) {
            return <div
                data-node-id={node.id}
                style={{
                    marginLeft: "2px",
                    marginRight: "2px"
                }}
                className={"loader-small " + TREE_NODE_SEGMENT_CLASS} >
            </div>;
        }
        else {
            const classes = [TREE_NODE_SEGMENT_CLASS, EXPANSION_TOGGLE_CLASS];
            if (!node.expanded) {
                classes.push(COLLAPSED_CLASS);
            }
            const className = classes.join(' ');
            return <div
                data-node-id={node.id}
                className={className}
                onClick={this.toggle}>
            </div>;
        }
    }

    protected createContainerAttributes(): React.HTMLAttributes<HTMLElement> {
        const attrs = super.createContainerAttributes();
        return {
            ...attrs,
            onDragEnter: event => this.handleDragEnterEvent(this.model.root, event),
            onDragOver: event => this.handleDragOverEvent(this.model.root, event),
            onDragLeave: event => this.handleDragLeaveEvent(this.model.root, event),
            onDragEnd: event => this.handleDragEndEvent(event),
            onDrop: event => this.handleDropEvent(this.model.root, event),
        };
    }

    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement> {
        const elementAttrs = super.createNodeAttributes(node, props);
        return {
            ...elementAttrs,
            draggable: !this.editedNode && DataTreeNode.is(node) && this.isDraggable(node.data),
            onDragStart: event => this.handleDragStartEvent(node, event),
            onDragEnter: event => this.handleDragEnterEvent(node, event),
            onDragOver: event => this.handleDragOverEvent(node, event),
            onDragLeave: event => this.handleDragLeaveEvent(node, event),
            onDragEnd: event => this.handleDragEndEvent(event),
            onDrop: event => this.handleDropEvent(node, event)
        };
    }

    protected updateGutter() {
        this.gutterWidth = 0;

        if (!this.gutterColumns.length) return;

        const visibleElements: any[] = [];
        Array.from(this.rows.values(), row => visibleElements.push((row.node as DataTreeNode).data));
        this.gutterColumns.forEach(col => col.computeWidth(visibleElements));
        this.visibleGutterColumns = this.gutterColumns.filter(col => col.width).sort((col1, col2) => col1.order - col2.order);
        this.gutterWidth = this.visibleGutterColumns.length ? this.visibleGutterColumns.map(col => col.width).reduce((w1, w2) => w1 + w2) : 0;
        this.gutterWidth += this.visibleGutterColumns.length * 4 + 4;
    }

    protected getPaddingLeft(node: TreeNode, props: NodeProps): number {
        const paddingLeft = super.getPaddingLeft(node, props);
        if (!this.gutterColumns.length)
            return paddingLeft;
        return paddingLeft + this.gutterWidth;
    }

    protected handleDragStartEvent(node: TreeNode, event: React.DragEvent): void {
        if (this.editedNode && this.editedNode.id === node.id) {
            return;
        }

        event.stopPropagation();
        let selectedNodes;

        if (this.model.selectedNodes.find(selected => TreeNode.equals(selected, node))) {
            selectedNodes = [...this.model.selectedNodes];
            const nodes = this.model.baseTree.allNodes;
            selectedNodes = selectedNodes.sort((node1, node2) => {
                const index1 = nodes.indexOf(node1);
                const index2 = nodes.indexOf(node2);
                return index1 - index2;
            });
        }
        else
            selectedNodes = [node];

        this.setSelectedTreeNodesAsData(event.dataTransfer, selectedNodes);

        if (event.dataTransfer && selectedNodes.length > 1) {
            const dragImage = document.createElement("div");
            dragImage.className = "theia-file-tree-drag-image";
            dragImage.textContent = String(selectedNodes.length);
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, -10, -10);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }

        this.onDragStartEmitter.fire(this.localDnDTransfer.elements || []);
    }

    protected handleDragOverEvent(node: TreeNode | undefined, event: React.DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!DataTreeNode.is(node))
            return;

        if (!DataTreeNode.is(node) && !this.toCancelNodeExpansion.disposed) {
            return;
        }
        const timer = setTimeout(() => {
            if (!node.expanded && this.isExpandable(node))
                this.model.expandNode(node);
        }, 500);
        this.toCancelNodeExpansion.push(Disposable.create(() => clearTimeout(timer)));
        this.dropTargetNode = node;
        const dropPosition = this.computeDropPosition(event);

        if (dropPosition !== this.dropPosition) {
            this.dropPosition = dropPosition;
            this.update();
        }
    }

    protected handleDragLeaveEvent(node: TreeNode | undefined, event: React.DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.toCancelNodeExpansion.dispose();
        if (this.dropTargetNode === node) {
            this.dropTargetNode = undefined;
            this.dropPosition = undefined;
        }
    }

    protected handleDragEnterEvent(node: TreeNode | undefined, event: React.DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.toCancelNodeExpansion.dispose();
        this.dropTargetNode = node;
        this.dropPosition = this.computeDropPosition(event);
        this.update();
    }

    protected handleDropEvent(node: TreeNode | undefined, event: React.DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropTargetNode = undefined;
        const dropPosition = this.dropPosition;
        this.dropPosition = undefined;
        this.update();

        if (!DataTreeNode.is(node))
            return;
        this.handleDrop(event, node.data, dropPosition || "on");
        event.dataTransfer.dropEffect = "none";
        this.localDnDTransfer.elements = undefined;
    }

    protected handleDragEndEvent(event: React.DragEvent): void {
        this.localDnDTransfer.elements = undefined;
        this.dropPosition = undefined;
        this.dropTargetNode = undefined;
        this.update();
        this.onDragEndEmitter.fire();
    }

    protected setSelectedTreeNodesAsData(data: DataTransfer, relatedNodes: TreeNode[]): void {
        const elements = relatedNodes.filter(node => DataTreeNode.is(node)).map(node => (node as DataTreeNode).data);
        // ensure selected elements are unique
        this.localDnDTransfer.elements = [...new Set(elements)];
        const dragData = this.getDragData(elements);
        dragData.forEach(dragData => data.setData(dragData.format, dragData.data));
    }

    private isDraggable(element: any): boolean {
        return this.dndHandler !== undefined && this.dndHandler.isDraggable(element);
    }

    protected getDragData(elements: any[]): DragData[] {
        if (this.dndHandler)
            return this.dndHandler.getDragData(elements);
        return [
            {
                format: "application/json",
                data: JSON.stringify(elements)
            }
        ];
    }

    protected handleDrop(event: React.DragEvent, target: any, position: DropPosition) {
        this.dndHandler?.handleDrop(event, target, position);
    }

    private computeDropPosition(event: React.DragEvent): DropPosition {
        const nodeRect = event.currentTarget.getBoundingClientRect();
        const offsetY = event.clientY - nodeRect.y;
        const percent = offsetY / nodeRect.height;
        if (percent <= 0.33)
            return this.transformDropPosition("before");
        else if (percent > 0.33 && percent <= 0.6)
            return "on";

        return this.transformDropPosition("after");
    }

    private transformDropPosition(dropPosition: Exclude<DropPosition, "on">): DropPosition {
        if (this.excludedDropPositionFeedback.includes(dropPosition))
            return "on";
        return dropPosition;
    }
}

export const renderOverlayIcon = (overlayIcon: OverlayIcon, index?: number) => {
    const style: any = {
        backgroundSize: `${overlayIcon.width}px ${overlayIcon.height}px`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        position: "absolute",
        width: overlayIcon.width,
        height: overlayIcon.height
    };

    switch (overlayIcon.position) {
        case "top-left":
            style.left = "0";
            style.top = "0";
            break;
        case "top-right":
            style.right = "0";
            style.top = "0";
            break;
        case "bottom-left":
            style.left = "0";
            style.bottom = "0";
            break;
        case "bottom-right":
            style.right = "0";
            style.bottom = "0";
            break;
    }

    return <div key={index} className={overlayIcon.iconClass} style={style} />;
};
