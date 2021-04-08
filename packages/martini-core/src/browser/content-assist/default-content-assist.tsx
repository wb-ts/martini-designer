import { debounce } from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HistoryManager } from "../history/history-manager";
import { ContentAssist, ContentAssistAdapter, ContentAssistProps, ContentProposal, ContentProposalProvider, InsertionBounds, TemplateContext, TemplateProposal } from "./content-assist";
import { ApplyEvent, ContentAssistPopup } from "./content-assist-popup";
import { InfoPopup } from "./info-popup";

export class DefaultContentAssist implements ContentAssist {
    private static readonly MAX_POPUP_WIDTH = 400;
    private static readonly MAX_POPUP_HEIGHT = 300;

    enabled = true;
    readonly proposalProviders: ContentProposalProvider[] = [];
    private activeTemplateProposal: TemplateProposal | undefined;
    private activeTemplateContext: TemplateContext | undefined;
    private readonly popupContainer: HTMLDivElement;
    private readonly infoPopupContainer: HTMLDivElement;

    constructor(
        private readonly node: HTMLElement,
        private readonly adapter: ContentAssistAdapter,
        private readonly historyManager: HistoryManager
    ) {
        node.addEventListener("keyup", e => {
            if (
                (e.target instanceof HTMLInputElement && e.target.type === "text") ||
                e.target instanceof HTMLTextAreaElement
            )
                return;
            if (e.key === "." || (e.key === " " && e.ctrlKey))
                this.show({});
        });

        this.popupContainer = document.createElement("div");
        this.popupContainer.style.width = DefaultContentAssist.MAX_POPUP_WIDTH + "px";
        this.popupContainer.style.height = DefaultContentAssist.MAX_POPUP_HEIGHT + "px";
        this.popupContainer.style.display = "none";
        this.popupContainer.style.position = "absolute";
        this.popupContainer.style.zIndex = "2000";
        document.body.append(this.popupContainer);

        this.infoPopupContainer = document.createElement("div");
        this.infoPopupContainer.style.display = "none";
        this.infoPopupContainer.style.position = "absolute";
        this.infoPopupContainer.style.maxWidth = DefaultContentAssist.MAX_POPUP_WIDTH + "px";
        this.infoPopupContainer.style.maxHeight = DefaultContentAssist.MAX_POPUP_HEIGHT + "px";
        this.infoPopupContainer.style.zIndex = "2000";
        this.infoPopupContainer.style.overflow = "auto";
        document.body.append(this.infoPopupContainer);

        const focusoutListener = (e: FocusEvent) => {
            if (!e.relatedTarget ||
                (!this.popupContainer.contains(e.relatedTarget as HTMLElement) &&
                    !this.infoPopupContainer.contains(e.relatedTarget as HTMLDivElement)))
                this.handleCancel();
        };
        this.popupContainer.addEventListener("focusout", focusoutListener);
        this.infoPopupContainer.addEventListener("focusout", focusoutListener);
    }

    show(props: ContentAssistProps): void {
        if (!this.enabled)
            return;
        const bounds = this.adapter.getInsertionBounds();
        this.showInfo.cancel();
        this.popupContainer.style.display = "unset";
        this.infoPopupContainer.style.display = "none";
        this.updateBounds(bounds);
        ReactDOM.unmountComponentAtNode(this.popupContainer);
        this.render(props);
    }

    dispose(): void {
        this.popupContainer.remove();
        this.infoPopupContainer.remove();
    }

    private updateBounds(bounds: InsertionBounds) {
        this.popupContainer.style.top = Math.min(window.innerHeight - DefaultContentAssist.MAX_POPUP_HEIGHT, (bounds.y + bounds.height)) + "px";
        this.popupContainer.style.left = Math.min(window.innerWidth - DefaultContentAssist.MAX_POPUP_WIDTH, bounds.x) + "px";
    }

    private handleCancel() {
        this.activeTemplateContext = undefined;
        this.activeTemplateProposal = undefined;
        this.showInfo.cancel();
        this.hideInfo();
        this.popupContainer.style.display = "none";
        ReactDOM.unmountComponentAtNode(this.popupContainer);
        this.node.focus();
    }

    private async handleApply(e: ApplyEvent) {
        const context = {
            historyManager: this.historyManager,
            target: this.adapter.getTarget(),
            selection: this.adapter.getSelection(),
            ...e
        };
        const selection = await e.proposal.apply(context);

        const _activeTemplateProposal = this.activeTemplateProposal;

        this.handleCancel();

        if (selection)
            await this.adapter.setSelection(selection);

        if (e.proposal.postApply)
            e.proposal.postApply(selection || context.selection);

        if (TemplateProposal.is(e.proposal))
            this.activeTemplateProposal = e.proposal;
        else
            this.activeTemplateProposal = _activeTemplateProposal;

        if (this.activeTemplateProposal) {
            this.activeTemplateContext = this.activeTemplateProposal.next(context, [...this.proposalProviders], e.proposal);

            if (this.activeTemplateContext.selection)
                await this.adapter.setSelection(this.activeTemplateContext.selection);

            if (!this.activeTemplateContext.proposalProviders.length) {
                if (this.activeTemplateProposal.postTemplateApply)
                    this.activeTemplateProposal.postTemplateApply();
                this.activeTemplateProposal = undefined;
                this.activeTemplateContext = undefined;
            } else {
                const searchPlaceholder = this.activeTemplateContext.message;
                this.show({
                    searchPlaceholder
                });
            }
        }
    }

    private handleSelectionChange(proposal?: ContentProposal) {
        if (proposal)
            this.showInfo(proposal);
        else
            this.hideInfo();
    }

    private readonly showInfo = debounce(proposal => this.doShowInfo(proposal), 300);

    private doShowInfo(proposal: ContentProposal) {
        if (!("information" in proposal)) {
            this.infoPopupContainer.style.display = "none";
            return;
        }

        this.infoPopupContainer.style.top = this.popupContainer.style.top;
        const popupBounds = this.popupContainer.getBoundingClientRect();
        const maxWidth = document.body.getBoundingClientRect().width;

        if (popupBounds.right + DefaultContentAssist.MAX_POPUP_WIDTH <= maxWidth) {
            this.infoPopupContainer.style.left = popupBounds.right + "px";
            this.infoPopupContainer.style.right = "unset";
            this.infoPopupContainer.style.float = "unset";
        }
        else {
            this.infoPopupContainer.style.right = (maxWidth - popupBounds.left) + "px";
            this.infoPopupContainer.style.left = "unset";
        }
        this.infoPopupContainer.style.display = "unset";
        this.renderInfo(proposal);
    }

    private hideInfo() {
        this.infoPopupContainer.style.display = "none";
        ReactDOM.unmountComponentAtNode(this.infoPopupContainer);
    }

    private renderInfo(proposal: ContentProposal) {
        ReactDOM.render(<InfoPopup proposal={proposal} />, this.infoPopupContainer);
    }

    private render(props: ContentAssistProps) {
        ReactDOM.render(<ContentAssistPopup
            proposalProviders={this.activeTemplateContext ? this.activeTemplateContext.proposalProviders : this.proposalProviders}
            defaultSearch={props.search}
            searchPlaceholder={props.searchPlaceholder}
            onApply={e => this.handleApply(e)}
            onCancel={() => this.handleCancel()}
            onSelectionChange={proposal => this.handleSelectionChange(proposal)}
            context={{
                selection: this.adapter.getSelection(),
                target: this.adapter.getTarget()
            }}
        />, this.popupContainer);
    }
}
