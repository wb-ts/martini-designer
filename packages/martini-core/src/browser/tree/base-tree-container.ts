import { createTreeContainer, Tree, TreeModel, TreeProps, TreeSearch } from "@theia/core/lib/browser";
import { SearchBoxFactory, SearchBoxProps } from "@theia/core/lib/browser/tree/search-box";
import { SearchBoxDebounce } from "@theia/core/lib/browser/tree/search-box-debounce";
import { interfaces } from "inversify";
import { BaseTree, BaseTreeModel, TreeContentProvider, TreeLabelProvider } from "./base-tree";
import { CustomSearchBox, CustomTreeSearch } from "./tree-search-box";

export interface BaseTreeContainerProps {
    contentProvider: interfaces.Newable<TreeContentProvider>;
    labelProvider: interfaces.Newable<TreeLabelProvider>;
}

export default function createBaseTreeContainer(
    parent: interfaces.Container,
    containerProps?: BaseTreeContainerProps,
    props?: Partial<TreeProps>
): interfaces.Container {
    const child = createTreeContainer(parent, props);
    child.bind(BaseTreeModel).toSelf();
    child.rebind(TreeModel).to(BaseTreeModel);
    child.bind(BaseTree).toSelf();
    child.rebind(Tree).toService(BaseTree);
    child.rebind(TreeSearch).to(CustomTreeSearch);
    child.rebind(SearchBoxFactory).toFactory(_ => (options: SearchBoxProps) => {
        const debounce = new SearchBoxDebounce(options);
        return new CustomSearchBox(options, debounce);
    });

    if (containerProps) {
        child
            .bind(TreeContentProvider)
            .to(containerProps.contentProvider)
            .inSingletonScope();
        child
            .bind(TreeLabelProvider)
            .to(containerProps.labelProvider)
            .inSingletonScope();
    }

    return child;
}
