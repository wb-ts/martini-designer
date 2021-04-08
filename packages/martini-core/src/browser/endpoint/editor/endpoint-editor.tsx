import { Disposable, Emitter, Event, MessageService } from "@theia/core";
import { Message, ReactWidget, Saveable, Widget, WidgetOpenerOptions, WidgetOpenHandler } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FormikErrors } from "formik";
import { inject, injectable, postConstruct } from "inversify";
import { cloneDeep, isEqualWith } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { createDefaultEndpoint } from "../../../common/endpoint/martini-endpoint-defaults";
import { EndpointEvent, EndpointType, MartiniEndpoint, MartiniEndpointManager, RssEndpoint } from "../../../common/endpoint/martini-endpoint-manager";
import { DocumentTypeManager } from "../../../common/tracker/document-type-manager";
import { Loader } from "../../components/loader";
import { ConfirmDialog, createListMessage } from "../../dialogs/dialogs";
import { EditorFlag } from "../../editor/editor-flag";
import { convertFormikErrors, errorsToString, FormError } from "../../form/form";
import { FormSearchBox } from "../../form/form-search-box";
import { NavigatorOpenHandler } from "../../navigator/martini-navigator-view-widget";
import { ProgressService } from "../../progress/progress-service";
import { EndpointEventDispatcher } from "../endpoint-event-dispatcher";
import { EndpointEditorToolbar } from "./endpoint-editor-toolbar";
import { RssEndpointForm } from "./rss/rss-endpoint-form";

export const EndpointEditorOptions = Symbol("EndpointEditorOptions");
export interface EndpointEditorOptions {
    uri: string;
    endpointType: EndpointType;
    packageName: string;
    name: string;
    isNew: boolean;
}

const EndpointEditorStyles = styled.div`
    display: grid;
    grid-template-rows: max-content 1fr;
    height: 100%;

    .content {
        padding: var(--theia-ui-padding);
        overflow-y: auto;
    }
`;

@injectable()
export class EndpointEditor extends ReactWidget implements Saveable {
    static readonly FACTORY_ID = "endpoint-editor";
    static readonly URI_SCHEME = "endpoint";

    @inject(EndpointEditorOptions)
    private readonly options: EndpointEditorOptions;
    @inject(MartiniEndpointManager)
    private readonly endpointManager: MartiniEndpointManager;
    @inject(EndpointEventDispatcher)
    private readonly endpointEventDispatcher: EndpointEventDispatcher;
    @inject(ProgressService)
    private readonly progressService: ProgressService;
    @inject(MessageService)
    private readonly messageService: MessageService;
    @inject(DocumentTypeManager)
    private readonly documentTypeManager: DocumentTypeManager;

    private currentEndpoint: MartiniEndpoint;
    private initialEndpoint: MartiniEndpoint;

    private _dirty: boolean = false;
    readonly autoSave: "off";
    private readonly onDirtyChangedEmitter = new Emitter<void>();
    readonly onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;
    private searchBox: FormSearchBox;
    private errors: FormError[] = [];
    private reset = false;

    @postConstruct()
    async init() {
        this.id = this.options.uri.toString();
        this.title.label = this.options.name;
        this.updateTitle();
        this.title.closable = true;
        this.node.tabIndex = -1;
        this.scrollOptions = undefined;
        this.searchBox = new FormSearchBox(this.node);
        EditorFlag.flag(this);

        if (!this.options.isNew) {
            this.update();
            this.initialEndpoint = await this.endpointManager.get(this.options.packageName, this.options.name) as MartiniEndpoint;
        }
        else {
            this.dirty = true;
            this.initialEndpoint = createDefaultEndpoint(this.options.packageName, this.options.name, this.options.endpointType);
        }

        this.currentEndpoint = cloneDeep(this.initialEndpoint);

        this.toDispose.push(this.endpointEventDispatcher.onEndpointEvent(this.handleEndpointEvent));
        this.update();
    }

    get dirty() {
        return this._dirty;
    }

    set dirty(dirty: boolean) {
        if (this._dirty !== dirty) {
            this._dirty = dirty;
            this.onDirtyChangedEmitter.fire();
        }
    }

    async save() {
        if (this.errors.length === 0) {
            await this.progressService.showProgress(messages.endpoint_editor_saving, async () => {
                try {
                    let start = false;
                    if (this.currentEndpoint.status === "STARTED") {
                        start = true;
                        await this.endpointManager.stop(this.currentEndpoint.packageName, this.currentEndpoint.name);
                    }
                    await this.endpointManager.save(this.currentEndpoint.packageName, this.currentEndpoint);
                    this.initialEndpoint = this.currentEndpoint;
                    if (this.options.isNew) {
                        this.options.isNew = false;
                        this.update();
                    }
                    this.dirty = false;
                    if (start)
                        await this.endpointManager.start(this.currentEndpoint.packageName, this.currentEndpoint.name);
                } catch (error) {
                    this.messageService.error(error.toString());
                }
            });
        } else {
            const dlg = new ConfirmDialog({
                title: messages.unable_to_save_title,
                showCancel: false,
                msg: createListMessage(
                    messages.unable_to_save,
                    this.errors.map(({ label, message }) => `${label}: ${message}`)
                )
            });
            await dlg.open();
        }
    }

    public render(): React.ReactNode {
        if (this.currentEndpoint) {
            return <EndpointEditorStyles tabIndex={-1}>
                <EndpointEditorToolbar
                    onStart={this.options.isNew ? undefined : this.handleStart}
                    onStop={this.options.isNew ? undefined : this.handleStop}
                    onTest={this.handleTestConfiguration}
                    onRevert={this.handleRevert}
                    onSearch={this.handleSearch}
                    endpointName={this.options.name}
                    endpointType={this.options.endpointType}
                    status={this.currentEndpoint.status}
                    errors={this.errors}
                />
                <div className="content">
                    {this.renderForm()}
                </div>
            </EndpointEditorStyles>;
        }
        else
            return <Loader message={messages.loading} />;
    }

    showSearchBox() {
        this.handleSearch();
    }

    onAfterAttach(msg: Message) {
        super.onAfterAttach(msg);

        if (this.searchBox.isAttached)
            Widget.detach(this.searchBox);
        Widget.attach(this.searchBox, this.node);
        this.node.addEventListener('keydown', e => {
            if (e.metaKey && e.key === 'f')
                this.handleSearch();
        });
        this.toDisposeOnDetach.push(Disposable.create(() => Widget.detach(this.searchBox)));
    }

    private handleChange(endpoint?: MartiniEndpoint) {
        if (endpoint)
            this.currentEndpoint = endpoint;
        this.dirty = this.isDirty();
    }

    // @ts-ignore
    private handleErrors(errors: FormikErrors<MartiniEndpoint>) {
        this.errors = convertFormikErrors(this.node, errors);
        this.updateTitle();
        this.update();
    }

    private handleTestConfiguration = async () => {
        this.progressService.showProgress(messages.endpoint_editor_testing, async () => {
            try {
                await this.endpointManager.test(this.currentEndpoint.packageName, this.currentEndpoint);
                this.messageService.info(messages.endpoint_editor_testing_success, {
                    timeout: 2000
                });
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleStart = async () => {
        if (this.currentEndpoint.status === "STARTED")
            return;
        this.progressService.showProgress(messages.endpoint_editor_starting, async () => {
            try {
                await this.endpointManager.start(this.options.packageName, this.options.name);
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleStop = async () => {
        if (this.currentEndpoint.status === "STOPPED")
            return;
        this.progressService.showProgress(messages.endpoint_editor_stopping, async () => {
            try {
                await this.endpointManager.stop(this.options.packageName, this.options.name);
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleRevert = async () => {
        const dlg = new ConfirmDialog({
            title: messages.revert_all_title,
            msg: messages.revert_all_question,
            ok: messages.revert
        });

        const revert = await dlg.open();
        if (revert) {
            this.currentEndpoint = this.initialEndpoint;
            this.reset = true;
            this.handleChange();
            this.update();
        }
    };

    private handleSearch = () => {
        this.searchBox.show();
        this.searchBox.activate();
    };

    private handleEndpointEvent = async (event: EndpointEvent) => {
        if (event.event === "DELETED") {
            this.close();
            return;
        }

        if (event.event === "STARTED" || event.event === "STOPPED") {
            this.currentEndpoint.status = event.event;
            this.update();
        } else if (event.event === "SAVED") {
            const updatedEndpoint = await this.endpointManager.get(this.options.packageName, this.options.name);
            if (!this.dirty) {
                this.currentEndpoint = updatedEndpoint!;
                this.reset = true;
                this.update();
            }
            this.initialEndpoint = updatedEndpoint!;
        }
    };

    private isDirty(): boolean {
        return this.options.isNew || !isEqualWith(this.initialEndpoint, this.currentEndpoint, (_value, _other, indexOrKey) => {
            if (indexOrKey === "status")
                return true;
        });
    }

    private updateTitle() {
        this.title.label = this.options.name;

        if (this.errors.length === 0) {
            this.title.caption = `Endpoint - ${this.options.name}`;
            this.title.iconClass = `martini-tab-icon martini-${this.options.endpointType}-endpoint-icon`;
        }
        else {
            this.title.iconClass = "martini-tab-icon martini-error-icon";
            this.title.caption = errorsToString(this.errors);
        }
    }

    private renderForm(): React.ReactNode {
        const _reset = this.reset;
        this.reset = false;
        switch (this.options.endpointType) {
            case EndpointType.RSS:
                return <RssEndpointForm
                    endpoint={this.currentEndpoint as RssEndpoint}
                    documentTypeProvider={() => this.documentTypeManager.getAll()}
                    onChange={endpoint => this.handleChange(endpoint)}
                    onValidate={errors => this.handleErrors(errors)}
                    reset={_reset}
                />;
            default:
                return <></>;
        }
    }
}

@injectable()
export class EndpointEditorNavigatorOpenHandler implements NavigatorOpenHandler {

    getUri(element: any): URI {
        return new URI(`${EndpointEditor.URI_SCHEME}://${encodeURI(element.packageName)}/${encodeURI(element.name)}?type=${element.type}`);
    }

    canHandle(element: any): boolean {
        return MartiniEndpoint.is(element);
    }

}

@injectable()
export class EndpointEditorOpenHandler extends WidgetOpenHandler<EndpointEditor> {
    readonly id = EndpointEditor.FACTORY_ID;

    canHandle(uri: URI, _?: WidgetOpenerOptions): number {
        return uri.scheme === EndpointEditor.URI_SCHEME ? 200 : -1;
    }

    protected createWidgetOptions(uri: URI, _?: WidgetOpenerOptions): EndpointEditorOptions {
        const params: { [key: string]: string; } = {};
        uri.query.split("&").forEach(param => {
            const [key, value] = param.split("=");
            params[key] = value;
        });
        return {
            uri: uri.withoutFragment().toString(),
            endpointType: MartiniEndpoint.getType(params["type"])!,
            name: uri.path.base,
            packageName: decodeURI(uri.authority),
            isNew: params["new"] === "true",
        };
    }
}
