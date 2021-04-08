import { ElementExt } from '@phosphor/domutils';
import { Disposable } from "@theia/core";
import { Message, ReactWidget } from "@theia/core/lib/browser";
import { SearchBox as TheiaSearchBox } from "@theia/core/lib/browser/tree/search-box";
import { debounce } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { SearchBox } from "../components/search-box";

export class FormSearchBox extends ReactWidget {
    static readonly MATCH_CLASS = "form-label-search-match";
    static readonly SELECTED_MATCH_CLASS = "form-label-selected-search-match";

    private searchMatches: HTMLLabelElement[] = [];
    private currentMatchIndex = -1;
    private inputRef: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(private readonly formNode: HTMLElement) {
        super();
        this.addClass(TheiaSearchBox.Styles.SEARCH_BOX);
        this.toDisposeOnDetach.push(Disposable.create(() => this.handleTextChangeDebounced.cancel()));
        this.formNode.addEventListener("keydown", e => this.handleKeyDown(e));
        this.hide();
        this.update();
    }

    protected onBeforeHide(msg: Message) {
        super.onBeforeHide(msg);
        if (this.inputRef.current)
            this.inputRef.current.value = "";
        this.clearHighlights();
    }

    protected render(): React.ReactNode {
        const message = this.searchMatches.length === 0 ? messages.no_matches : messages.matches_of(this.currentMatchIndex + 1, this.searchMatches.length);

        return <SearchBox
            onTextChange={text => this.handleTextChangeDebounced(text)}
            onClose={() => this.hide()}
            onKeyDown={e => this.handleKeyDown(e.nativeEvent)}
            onNext={() => this.handleNext()}
            onPrevious={() => this.handlePrevious()}
            message={message}
            inputRef={this.inputRef}
        />;
    }

    onActivateRequest(msg: Message) {
        super.onActivateRequest(msg);
        this.inputRef.current?.focus();
        this.update();
    }

    private handleTextChangeDebounced = debounce(text => this.handleTextChange(text), 300);

    protected handleTextChange(text: string) {
        text = text.trim().toLowerCase();
        this.clearHighlights();
        if (text.length) {
            const elements = Array.from(this.formNode.getElementsByTagName("label"));
            this.searchMatches = elements.filter(label => {
                return label.textContent && label.textContent.toLowerCase().includes(text);
            });

            if (this.searchMatches.length !== 0) {
                this.searchMatches.forEach(match => match.classList.add(FormSearchBox.MATCH_CLASS));
                this.currentMatchIndex = 0;
                this.showMatch();
            }
        }

        this.update();
    }

    protected handleNext() {
        if (this.searchMatches.length !== 0 && this.currentMatchIndex >= 0) {
            this.searchMatches[this.currentMatchIndex].classList.remove(FormSearchBox.SELECTED_MATCH_CLASS);
            this.currentMatchIndex = this.currentMatchIndex < this.searchMatches.length - 1 ? this.currentMatchIndex + 1 : 0;
            this.update();
            this.showMatch();
        }
    }

    protected handlePrevious() {
        if (this.searchMatches.length !== 0 && this.currentMatchIndex >= 0) {
            this.searchMatches[this.currentMatchIndex].classList.remove(FormSearchBox.SELECTED_MATCH_CLASS);
            this.currentMatchIndex = this.currentMatchIndex > 0 ? this.currentMatchIndex - 1 : this.searchMatches.length - 1;
            this.update();
            this.showMatch();
        }
    }

    private showMatch() {
        if (this.currentMatchIndex < 0)
            return;
        this.focusMatchingInput();
        this.inputRef.current?.focus();
        const match = this.searchMatches[this.currentMatchIndex];
        match.classList.add(FormSearchBox.SELECTED_MATCH_CLASS);
        ElementExt.scrollIntoViewIfNeeded(this.formNode, match);
    }

    private clearHighlights() {
        this.searchMatches.forEach(match => {
            match.classList.remove(FormSearchBox.MATCH_CLASS);
            match.classList.remove(FormSearchBox.SELECTED_MATCH_CLASS);
        });
        this.searchMatches = [];
    }

    private focusMatchingInput() {
        const match = this.searchMatches[this.currentMatchIndex];
        this.getNextFocusable(match)?.focus();
    }

    private getNextFocusable(element: HTMLElement): HTMLElement | undefined {
        const focusableElement = element.nextElementSibling?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElement)
            return (focusableElement as HTMLElement);
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (this.isHidden)
            return;
        if (e.key === "Escape") {
            this.hide();
            e.preventDefault();
            e.stopPropagation();
        }
        else if (e.key === "Enter" && !e.metaKey) {
            this.handleNext();
            e.preventDefault();
            e.stopPropagation();
        }
        else if (e.key === "Enter" && e.metaKey) {
            this.handlePrevious();
            e.preventDefault();
            e.stopPropagation();
        }
        else if (e.key === "Tab") {
            e.preventDefault();
            this.focusMatchingInput();
            this.hide();
        }
    }
}
