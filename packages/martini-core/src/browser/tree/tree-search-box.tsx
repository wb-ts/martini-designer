import { Key, KeyCode, TreeNode, TreeSearch } from "@theia/core/lib/browser";
import { FuzzySearch } from "@theia/core/lib/browser/tree/fuzzy-search";
import { SearchBox, SearchBoxProps } from "@theia/core/lib/browser/tree/search-box";
import { SearchBoxDebounce } from "@theia/core/lib/browser/tree/search-box-debounce";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { DataTreeNode, TreeLabelProvider } from "./base-tree";

@injectable()
export class CustomTreeSearch extends TreeSearch {

    @inject(TreeLabelProvider)
    private readonly treeLabelProvider: TreeLabelProvider;

    protected init(): void {
        Object.assign(this, {
            labelProvider: {
                getName: (node: DataTreeNode) => {
                    if (node.parent) {
                        const caption = this.treeLabelProvider.getCaption(node.data);
                        if (Array.isArray(caption))
                            return caption
                                .filter(element => typeof element === "object" && "props" in (element as any))
                                .map((element: React.ReactElement) => element.props.children)
                                .join(" ");

                        return caption || "";
                    }
                    else
                        return "";
                }
            },
            fuzzySearch: {
                filter: (input: FuzzySearch.Input<TreeNode>) => {
                    const pattern = input.pattern.toLowerCase();
                    return input.items.filter(item => {
                        const str = input.transform(item).toLowerCase();
                        return str.includes(pattern);
                    }).map(item => ({
                        item,
                        ranges: []
                    }));
                }
            }
        });
    }


}

@injectable()
export class CustomSearchBox extends SearchBox {
    private matchesLabel: HTMLDivElement;
    private currentIndex = -1;
    private _totalMatches = -1;

    constructor(props: SearchBoxProps, debounce: SearchBoxDebounce) {
        super(props, debounce);
        this.onNext(() => {
            this.currentIndex++;
            if (this.currentIndex >= this._totalMatches)
                this.currentIndex = 0;
            this.updateLabel();
        });
        this.onPrevious(() => {
            this.currentIndex--;
            if (this.currentIndex < 0)
                this.currentIndex = this._totalMatches - 1;
            this.updateLabel();
        });
    }

    set totalMatches(totalMatches: number) {
        this.currentIndex = 0;
        this._totalMatches = totalMatches;
        this.updateLabel();
    }

    protected canHandle(keyCode: KeyCode | undefined): boolean {
        const activeElement = document.activeElement;
        if (!this.isVisible && ((activeElement instanceof HTMLInputElement && activeElement.type === "text") ||
            activeElement instanceof HTMLTextAreaElement || keyCode?.character === "."))
            return false;
        return super.canHandle(keyCode) || (this.isVisible && keyCode?.key === Key.TAB);
    }

    protected handleKey(keyCode: KeyCode): void {
        if (keyCode.key === Key.TAB) {
            if (keyCode.shift)
                this.previousEmitter.fire();
            else
                this.nextEmitter.fire();
        }
        else
            super.handleKey(keyCode);
    }

    protected createContent(): {
        container: HTMLElement,
        input: HTMLInputElement,
        filter: HTMLElement | undefined,
        previous: HTMLElement | undefined,
        next: HTMLElement | undefined,
        close: HTMLElement | undefined;
    } {
        const content = super.createContent();
        this.matchesLabel = document.createElement("div");
        this.matchesLabel.style.paddingLeft = "4px";
        this.matchesLabel.style.minWidth = "80px";
        this.matchesLabel.textContent = messages.no_matches;
        content.container.insertBefore(this.matchesLabel, content.input.nextElementSibling);

        content.input.placeholder = messages.search_placeholder;
        return content;
    }

    private updateLabel() {
        this.matchesLabel.textContent = this._totalMatches > 0 ?
            messages.matches_of(this.currentIndex + 1, this._totalMatches) :
            messages.no_matches;
    }

    focusInput(reset = false) {
        this.input.focus();
        if (reset)
            this.input.value = "";
    }

}
