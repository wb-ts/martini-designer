import { MaybePromise, ProgressUpdate } from "@theia/core";
import { Message, setEnabled } from "@theia/core/lib/browser";
import { DialogError, DialogMode, DialogProps } from "@theia/core/lib/browser/dialogs";
import { ReactDialog } from "@theia/core/lib/browser/dialogs/react-dialog";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { Loader } from "../components/loader";
import { Progress } from "../progress/progress-service";

/**
 * Base dialog with support for async init and tasks with progress report.
 */
export abstract class BaseDialog<T> extends ReactDialog<T> {

    private progressUpdate: ProgressUpdate | undefined;
    private progress: Progress | undefined;

    constructor(props: DialogProps) {
        super(props);
        this.contentNode.style.justifyContent = "flex-start";
    }

    open(): Promise<T | undefined> {
        this._init();
        return super.open();
    }

    /**
     * Initializes the dialog, any async initialization should take place here.
     * This function is called when the open function is called by the dialog client.
     *
     * @param progress used to report progress on the initialization
     */
    protected init(progress: Progress): Promise<void> {
        return Promise.resolve();
    }

    protected render(): React.ReactNode {
        return <>
            {this.doRender()}
            {this.isInProgress() && this.renderProgressUpdate()}
        </>;
    }

    /**
     * Renders the dialog content, this function should be implemented by client instead of overriding the render function.
     */
    protected abstract doRender(): React.ReactNode;

    /**
     * Shows the progress for the given task.
     *
     * @param message the message to display
     * @param task the task to execute
     */
    protected async showProgress<T>(message: string | undefined, task: (progress: Progress) => Promise<T>): Promise<T> {
        let cancelled = false;
        this.progress = {
            id: "",
            cancel: () => {
                cancelled = true;
                // if there is a progress it means it is cancelled by the progress client
                // if not it means it's cancelled by the dialog being disposed
                if (this.progress) {
                    // set progress to undefined to prevent recursion
                    this.progress = undefined;
                    this.close();
                }
            },
            isCancelled: () => cancelled,
            report: (update: ProgressUpdate) => {
                this.progressUpdate = update;
                this.update();
            },
            result: Promise.resolve(undefined)
        };
        let result;
        try {
            this.progressUpdate = {
                message
            };
            this.update();
            result = await task(this.progress);
        } catch (error) {
            console.error(error);
            new ConfirmDialog({
                title: messages.error_title,
                showCancel: false,
                msg: error.message
            }).open();
        }
        this.progressUpdate = undefined;
        this.progress = undefined;
        this.update();
        return result as T;
    }

    protected isValid(value: T, mode: DialogMode): MaybePromise<DialogError> {
        if (this.isInProgress())
            return false;
        return super.isValid(value, mode);
    }

    protected setErrorMessage(error: DialogError): void {
        if (this.acceptButton)
            this.setEnabled(this.acceptButton, DialogError.getResult(error));
        this.errorMessageNode.innerText = DialogError.getMessage(error);
    }

    protected setEnabled(button: HTMLButtonElement, enabled: boolean) {
        setEnabled(button, enabled);
        button.disabled = !enabled;
    }

    /**
     * Returns whether or not there is a task currently in progress.
     */
    protected isInProgress(): boolean {
        return this.progress !== undefined;
    }

    private renderProgressUpdate(): React.ReactNode {
        if (!this.progressUpdate)
            return <></>;
        return <Loader
            message={this.progressUpdate.message}
            style={{
                background: "var(--theia-editorWidget-background)"
            }}
        />;
    }

    private async _init(): Promise<void> {
        await this.showProgress(undefined, progress => this.init(progress));
    }

    close() {
        if (this.progress && !this.progress.isCancelled())
            this.progress.cancel();
        super.close();
    }
}

export interface ConfirmDialogProps extends DialogProps {
    readonly msg: string | React.ReactNode;
    readonly cancel?: string;
    readonly ok?: string;
    readonly maxWidth?: number;
    readonly showCancel?: boolean;
}

export class ConfirmDialog extends ReactDialog<boolean> {
    protected confirmed = true;

    constructor(protected readonly props: ConfirmDialogProps) {
        super(props);
        const maxWidth = props.maxWidth || 350;
        applySize(this.contentNode, { maxWidth });
        if (this.props.showCancel === undefined || this.props.showCancel)
            this.appendCloseButton(props.cancel);
        this.appendAcceptButton(props.ok);
    }

    protected render(): React.ReactNode {
        if (typeof this.props.msg === "string") return <div>{this.props.msg}</div>;
        return this.props.msg;
    }

    protected onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
        this.confirmed = false;
        this.accept();
    }

    get value(): boolean {
        return this.confirmed;
    }

}

export const createListMessage = (
    msg: string,
    list: string[]
): React.ReactNode => {
    return (
        <>
            {msg}
            <br />
            <ul>
                {list.map((item, i) => (
                    <li key={i}>{item}</li>
                ))}
            </ul>
        </>
    );
};

const getSize = (size: string | number) => {
    if (typeof size === "number")
        return `${size}px`;
    return size;
};

export const applySize = (dialogContentNode: HTMLElement, size: { width?: string | number, maxWidth?: string | number, height?: string | number; }) => {
    if (size.width)
        dialogContentNode.style.width = getSize(size.width);
    if (size.maxWidth)
        dialogContentNode.style.maxWidth = getSize(size.maxWidth);
    if (size.height)
        dialogContentNode.style.height = getSize(size.height);
};
