import { Emitter, MessageService, ResourceProvider } from "@theia/core";
import { BaseWidget, Saveable } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { inject, injectable, postConstruct } from "inversify";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { withoutScheme } from "../../common/fs/file-util";
import { Loader } from "../components/loader";
import { HistoryManager, HistoryManagerProvider } from "../history/history-manager";
import { ProgressService } from "../progress/progress-service";
import { EditorFlag } from "./editor-flag";

export const FileEditorOptions = Symbol("FileEditorOptions");

export interface FileEditorOptions {
    uri: string;
}

@injectable()
export abstract class BaseFileEditor extends BaseWidget implements Saveable, HistoryManagerProvider {
    @inject(FileEditorOptions)
    protected readonly options: FileEditorOptions;
    @inject(ResourceProvider)
    protected readonly resourceProvider: ResourceProvider;
    @inject(ProgressService)
    protected readonly progressService: ProgressService;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(HistoryManager)
    historyManager: HistoryManager;

    private _dirty = false;
    private readonly onDirtyChangeEmitter = new Emitter<void>();
    readonly onDirtyChanged = this.onDirtyChangeEmitter.event;
    readonly autoSave = "off";
    protected fileContent: string = "";
    protected abstract iconClass: string;

    @postConstruct()
    protected async init() {
        const uri = new URI(this.options.uri);
        this.id = this.options.uri;
        this.title.label = uri.path.base.replace(uri.path.ext, "");
        this.title.iconClass = this.iconClass;
        this.title.caption = withoutScheme(uri);
        this.title.closable = true;
        Saveable.apply(this);
        EditorFlag.flag(this);

        ReactDOM.render(<Loader message={messages.loading} />, this.node);
        this.update();

        await this.readFile();

        ReactDOM.unmountComponentAtNode(this.node);

        this.doInit();
    }

    protected abstract doInit(): void;

    get dirty() {
        return this._dirty;
    }

    set dirty(dirty: boolean) {
        if (this._dirty !== dirty) {
            this._dirty = dirty;
            this.onDirtyChangeEmitter.fire();
        }
    }

    async save(): Promise<void> {
        const filePath = withoutScheme(new URI(this.options.uri));
        await this.progressService.showProgress(messages.saving_file(filePath), async () => {
            const content = await this.writeFileContent();
            const resource = await this.resourceProvider(new URI(this.options.uri));
            await resource.saveContents!(content);
            this.dirty = false;
        });
        this.messageService.info(messages.file_saved_success(filePath), {
            timeout: 2000
        });
    }

    protected async readFile(): Promise<void> {
        const resource = await this.resourceProvider(new URI(this.options.uri));
        const content = await resource.readContents();
        await this.readFileContent(content);
    }

    protected readFileContent(content: string): Promise<void> {
        return Promise.resolve();
    }

    protected writeFileContent(): Promise<string> {
        return Promise.resolve("");
    }
}
