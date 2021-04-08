import { Disposable, DisposableCollection, Emitter, Event } from "@theia/core";
import { injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { BaseDialog } from "../dialogs/dialogs";
import { Progress } from "../progress/progress-service";

export interface Wizard extends Disposable {
    currentPage: WizardPage | undefined;
    firstPage: WizardPage;
    title: string;
    onCompleteChanged: Event<void>;
    onUpdate: Event<void>;
    hasNext: boolean;
    hasPrevious: boolean;
    initialSize?: { width?: number, height?: number; };

    init(progress: Progress): Promise<void>;

    performFinish(progress: Progress): Promise<boolean>;

    canFinish(): boolean;

    getNextPage(current: WizardPage | undefined): WizardPage | undefined;

    getPreviousPage(current: WizardPage | undefined): WizardPage | undefined;

    render(): React.ReactNode;

    next(): void;

    previous(): void;
}

export interface WizardPage extends Disposable {
    description?: string;
    complete: boolean;
    onCompleteChanged: Event<void>;
    onUpdate: Event<void>;

    render(): React.ReactNode;

    dispose(): void;
}

@injectable()
export abstract class AbstractWizard implements Wizard {
    protected onCompleteChangedEmitter = new Emitter<void>();
    readonly onCompleteChanged = this.onCompleteChangedEmitter.event;
    protected onUpdateEmitter = new Emitter<void>();
    readonly onUpdate = this.onUpdateEmitter.event;

    abstract title: string;
    protected pages: WizardPage[] = [];
    protected history: WizardPage[] = [];
    protected current: WizardPage;
    protected toDispose = new DisposableCollection();

    /**
     * Initializes the wizard. If this method is overridden it should call super when all the pages have been added already.
     *
     * @param progress used to report progress
     */
    async init(progress: Progress): Promise<void> {
        if (this.pages.length) this.current = this.firstPage;
        this.toDispose.pushAll(this.pages);
    }

    abstract performFinish(progress: Progress): Promise<boolean>;

    canFinish(): boolean {
        return (
            this.pages.length === 0 ||
            (this.currentPage !== undefined &&
                this.currentPage.complete &&
                this.getNextPage(this.current) === undefined)
        );
    }

    getNextPage(current: WizardPage | undefined): WizardPage | undefined {
        if (!current) return undefined;
        const index = this.pages.indexOf(current);
        if (index >= 0 && index + 1 < this.pages.length)
            return this.pages[index + 1];
        return undefined;
    }

    getPreviousPage(current: WizardPage | undefined): WizardPage | undefined {
        return this.history.length === 0 ? undefined : this.history[this.history.length - 1];
    }

    render(): React.ReactNode {
        const page = this.currentPage;
        if (page) {
            return (
                <div style={{ display: "grid", overflowY: "hidden" }}>
                    {page.description && (
                        <>
                            <div
                                style={{
                                    marginBottom: 5,
                                    padding: "6px 12px"
                                }}
                            >
                                {page.description}
                            </div>
                            <div
                                style={{
                                    borderTop: "1px solid var(--theia-panel-border)",
                                    width: "100%",
                                    marginBottom: 5
                                }}
                            />
                        </>
                    )}
                    <div style={{ padding: "6px 12px", overflowY: "auto" }}>{page.render()}</div>
                </div>
            );
        }
        return <></>;
    }

    get firstPage() {
        return this.pages[0];
    }

    get currentPage() {
        return this.current;
    }

    get hasNext() {
        return this.pages.length > 1;
    }

    get hasPrevious() {
        return this.hasNext;
    }

    next(): void {
        if (this.current && this.current.complete) {
            const next = this.getNextPage(this.current);
            if (next) {
                this.history.push(this.current);
                this.current = next;
                this.onCompleteChangedEmitter.fire();
                this.onUpdateEmitter.fire();
            }
        }
    }

    previous(): void {
        if (this.current) {
            const previous = this.getPreviousPage(this.current);
            if (previous) {
                this.current = previous;
                this.history.pop();
                this.onCompleteChangedEmitter.fire();
                this.onUpdateEmitter.fire();
            }
        }
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}

@injectable()
export abstract class AbstractWizardPage implements WizardPage {
    protected _complete = false;
    protected onCompleteChangedEmitter = new Emitter<void>();
    readonly onCompleteChanged = this.onCompleteChangedEmitter.event;
    protected onUpdateEmitter = new Emitter<void>();
    readonly onUpdate = this.onUpdateEmitter.event;
    protected toDispose = new DisposableCollection();
    protected _description = "";

    abstract render(): React.ReactNode;

    get complete() {
        return this._complete;
    }

    set complete(complete: boolean) {
        this._complete = complete;
        this.onCompleteChangedEmitter.fire();
    }

    set description(description: string) {
        if (this._description !== description) {
            this._description = description;
            this.onUpdateEmitter.fire();
        }
    }

    get description() {
        return this._description;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}

export interface WizardDialogProps {
    acceptLabel?: string;
    width?: number;
    height?: number;
}

export class WizardDialog extends BaseDialog<boolean> {
    protected readonly previousBtn: HTMLButtonElement | undefined;
    protected readonly nextBtn: HTMLButtonElement | undefined;
    protected readonly currentPageDisposable = new DisposableCollection();
    protected oldCurrent: WizardPage | undefined;
    private performingFinish = false;
    value = false;

    constructor(protected readonly wizard: Wizard, props?: WizardDialogProps) {
        super({
            title: wizard.title
        });
        const acceptLabel =
            props && props.acceptLabel ? props.acceptLabel : messages.finish;

        if (wizard.hasPrevious) {
            this.previousBtn = this.appendButton(this.createButton(messages.previous));
            this.previousBtn.addEventListener("click", () => this.wizard.previous());
        }
        if (wizard.hasNext) {
            this.nextBtn = this.appendButton(this.createButton(messages.next));
            this.nextBtn.addEventListener("click", () => this.wizard.next());
        }
        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(acceptLabel);

        if (props && (props.width || props.height)) {
            const style = (this.node.children.item(0) as HTMLDivElement).style;
            style.justifyContent = "flex-start";
            if (props.width) {
                style.maxWidth = `${props.width}px`;
                style.width = `${props.width}px`;
            }

            if (props.height) {
                style.maxHeight = `${props.height}px`;
                style.height = `${props.height}px`;
            }
        }

        this.contentNode.setAttribute(
            "style",
            "justify-content: flex-start; padding-left: 0; padding-right: 0; overflow-y: hidden;"
        );
    }

    protected async init(progress: Progress): Promise<void> {
        if (this.acceptButton)
            this.setEnabled(this.acceptButton, false);
        await this.wizard.init(progress);
        this.wizard.onCompleteChanged(() => this.updateButtons());
        this.wizard.onUpdate(() => this.update());
        this.updateButtons();
        this.update();
    }

    protected doRender(): React.ReactNode {
        this.currentPageDisposable.dispose();
        if (this.wizard.currentPage) {
            this.currentPageDisposable.pushAll([
                this.wizard.currentPage.onCompleteChanged(() => this.updateButtons()),
                this.wizard.currentPage.onUpdate(() => this.update())
            ]);
        }
        return this.wizard.render();
    }

    protected async accept(): Promise<void> {
        if (!this.resolve || this.performingFinish || this.acceptButton?.disabled || !this.wizard.canFinish())
            return;
        try {
            if (this.acceptButton)
                this.setEnabled(this.acceptButton, false);
            this.performingFinish = true;
            this.value = await this.showProgress(undefined, async progress => await this.wizard.performFinish(progress));
        } finally {
            if (this.acceptButton)
                this.setEnabled(this.acceptButton, true);
            this.performingFinish = false;
        }
        if (this.value) {
            this.wizard.dispose();
            return super.accept();
        }
    }

    close(): void {
        this.wizard.dispose();
        super.close();
    }

    protected updateButtons() {
        if (this.isInProgress())
            return;
        if (this.previousBtn) {
            this.setEnabled(
                this.previousBtn,
                this.wizard.getPreviousPage(this.wizard.currentPage) !== undefined
            );
        }

        if (this.nextBtn) {
            this.setEnabled(
                this.nextBtn,
                this.wizard.currentPage !== undefined &&
                this.wizard.currentPage.complete &&
                this.wizard.getNextPage(this.wizard.currentPage) !== undefined
            );
        }
        if (this.acceptButton)
            this.setEnabled(this.acceptButton, this.wizard.canFinish());

        if (this.oldCurrent !== this.wizard.currentPage) {
            this.oldCurrent = this.wizard.currentPage;
            this.update();
        }
    }

    private appendButton(button: HTMLButtonElement): HTMLButtonElement {
        this.controlPanel.appendChild(button);
        button.classList.add("secondary");
        return button;
    }

}
