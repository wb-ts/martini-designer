import { ExpandableTreeNode, TreeNode } from "@theia/core/lib/browser";
import { BaseTreeModel } from "../tree/base-tree";
import { BaseTreeWidget } from "../tree/base-tree-widget";
import { ContentAssistAdapter, InsertionBounds, Selection } from "./content-assist";

export class TreeContentAssistAdapter implements ContentAssistAdapter {
    constructor(private readonly tree: BaseTreeWidget) {}

    getInsertionBounds(): InsertionBounds {
        const treeBounds = this.tree.node.getBoundingClientRect();
        let selectedNode: TreeNode = this.tree.model.selectedNodes[0];

        if (!selectedNode || selectedNode === this.tree.model.root) {
            const allNodes = (this.tree.model as BaseTreeModel).baseTree.allNodes;
            selectedNode = allNodes[allNodes.length - 1];
        }

        if (selectedNode) {
            const element = this.tree.node.querySelector(`[data-node-id='${selectedNode.id}'`);
            if (element) {
                const bounds = element.parentElement!.getBoundingClientRect();
                const _bounds = DOMRect.fromRect(bounds);
                _bounds.y = Math.min(treeBounds.bottom - bounds.height, bounds.y);
                return _bounds;
            }
        }

        return {
            x: treeBounds.x,
            y: treeBounds.y,
            width: treeBounds.width,
            height: 20
        };
    }

    getTarget(): any {
        const firstSelected = this.tree.model.selectedElements[0];

        if (!firstSelected) return this.tree.model.rootData;

        return firstSelected;
    }

    getSelection(): Selection {
        return this.tree.model.selectedElements;
    }

    async setSelection(selection: Selection): Promise<void> {
        await this.tree.model.waitForRefresh;
        this.tree.model.selectElements(element => selection.includes(element));
        const node = this.tree.model.findNode(selection[0]);
        if (node && node.parent && ExpandableTreeNode.is(node.parent)) await this.tree.model.expandNode(node.parent);
        await this.tree.forceRender();
    }
}
