import { ExpandableTreeNode } from "@theia/core/lib/browser";
import { BaseTreeWidget } from "../tree/base-tree-widget";
import { ContentAssistAdapter, InsertionBounds, Selection } from "./content-assist";

export class TreeContentAssistAdapter implements ContentAssistAdapter {
    constructor(private readonly tree: BaseTreeWidget) {}

    getInsertionBounds(): InsertionBounds {
        const treeBounds = this.tree.node.getBoundingClientRect();
        const selectedNode = this.tree.model.selectedNodes[0];
        if (selectedNode) {
            const element = this.tree.node.querySelector(`[data-node-id='${selectedNode.id}'`);
            if (element) return element.parentElement!.getBoundingClientRect();
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
