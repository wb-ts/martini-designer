import { MaybePromise } from "@theia/core";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { OverlayIconProps } from "../components/icon-overlay";
import { HistoryManager } from "../history/history-manager";

export interface ContentAssist {
    enabled: boolean;
    show(props: ContentAssistProps): void;
    proposalProviders: ContentProposalProvider[];
    dispose(): void;
}

export interface ContentAssistProps {
    searchPlaceholder?: string;
    search?: string;
    proposalProviderOverrides?: ContentProposalProvider[];
}

export type Selection = any[];

export interface ContentAssistQuery {
    search: string;
    target: any;
    selection: Selection;
}

export interface ContentProposalProvider {
    getProposals(query: ContentAssistQuery, acceptor: (proposals: ContentProposal[]) => void): void;
}

export namespace ContentProposalProvider {
    export function make(provider: () => ContentProposal[]): ContentProposalProvider {
        return {
            getProposals: (_, acceptor) => acceptor(provider())
        };
    }
}

export interface ContentProposal {
    label: React.ReactNode;
    iconClass?: string;
    overlayIcons?: OverlayIconProps[];
    information?: React.ReactNode;
    sortValue?: string;
    relevance?: number;
    apply: (context: ContentAssistContext) => MaybePromise<Selection | undefined>;
    postApply?: (selection: Selection | undefined) => void;
    getApplyModes?: (selection: Selection, target: any) => ApplyMode[];
}

export namespace ContentProposal {
    export function noop(init: Omit<ContentProposal, "apply" | "postApply" | "getApplyModes">): ContentProposal {
        return {
            ...init,
            apply: () => undefined
        };
    }

    export const none = ContentProposal.noop({
        label: messages.none,
        iconClass: "martini-tree-icon martini-disabled-icon"
    });
}

export interface TemplateProposal {
    next(
        context: ContentAssistContext,
        proposalProviders: ContentProposalProvider[],
        proposal: ContentProposal
    ): TemplateContext;
    postTemplateApply?(): void;
}

export namespace TemplateProposal {
    export function is(object: any): object is TemplateProposal {
        return !!object && "next" in object;
    }
}

export interface TemplateContext {
    proposalProviders: ContentProposalProvider[];
    selection?: Selection;
    message?: string;
}

export interface ApplyMode {
    name: string;
    metaKey?: boolean;
    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
}

export namespace ApplyMode {
    export function noKey(applyMode: ApplyMode): boolean {
        return !applyMode.metaKey && !applyMode.altKey && !applyMode.ctrlKey && !applyMode.shiftKey;
    }

    export function matches(applyMode: ApplyMode, modifiers: Omit<ApplyMode, "name">): boolean {
        return (
            modifiers.metaKey === (applyMode.metaKey || false) &&
            modifiers.altKey === (applyMode.altKey || false) &&
            modifiers.shiftKey === (applyMode.shiftKey || false) &&
            modifiers.ctrlKey === (applyMode.ctrlKey || false)
        );
    }
}

export interface ContentAssistContext {
    selection: Selection;
    target: any;
    historyManager: HistoryManager;
    metaKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
}

export interface ContentAssistAdapter {
    getInsertionBounds(): InsertionBounds;
    getTarget(): any;
    getSelection(): Selection;
    setSelection(selection: Selection): Promise<void>;
}

export interface InsertionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class BaseContentProposal implements ContentProposal {
    label: React.ReactNode;
    iconClass: string | undefined;
    overlayIcons: OverlayIconProps[] | undefined;
    category: string | undefined;
    sortValue: string | undefined;
    relevance: number | undefined;
    abstract apply(context: ContentAssistContext): MaybePromise<Selection | undefined>;
}
