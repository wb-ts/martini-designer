import * as React from "react";
import { EditorWidget, TextEditorProvider } from "@theia/editor/lib/browser";
import { MonacoEditorModel } from "@theia/monaco/lib/browser/monaco-editor-model";
import { injectable, interfaces } from "inversify";
import URI from "@theia/core/lib/common/uri";
import { MartiniResourceResolver } from "../fs/martini-resource-resolver";
import { MonacoWorkspace } from "@theia/monaco/lib/browser/monaco-workspace";
import { MonacoEditor } from "@theia/monaco/lib/browser/monaco-editor";
import { SelectionService } from "@theia/core";
import IEditorOptions = monaco.editor.IEditorOptions;
import { isEqual } from "lodash";

export interface EmbeddedTextEditorOptions {
    initialContent?: string;
    editorOptions?: IEditorOptions;
    languageId?: string;
}

export const EmbeddedTextEditorProvider = Symbol("EmbeddedTextEditorProvider");
export type EmbeddedTextEditorProvider = (options: EmbeddedTextEditorOptions) => Promise<EditorWidget>;

@injectable()
export class CustomMonacoWorkspace extends MonacoWorkspace {

    protected openEditorIfDirty(model: MonacoEditorModel): void {
        if (!model.uri.startsWith(MartiniResourceResolver.INMEMORY_SCHEME))
            super.openEditorIfDirty(model);
    }

}

export interface EmbeddedTextEditorProps {
    provider: EmbeddedTextEditorProvider;
    languageId?: string;
    initialContent?: string;
    onContentChanged?: (content: string) => void;
    width?: number | string;
    height?: number | string;
    editorOptions?: IEditorOptions;
    setContentRef?: React.RefObject<(content: string) => void>;
    focusOnMount?: boolean;
    markers?: monaco.editor.IMarkerData[];
}

export class EmbeddedTextEditor extends React.Component<EmbeddedTextEditorProps> {
    readonly containerRef: React.RefObject<HTMLDivElement>;
    private textEditor: EditorWidget | undefined;

    constructor(props: EmbeddedTextEditorProps) {
        super(props);
        this.containerRef = React.createRef<HTMLDivElement>();
    }

    componentDidMount() {
        this.initMonaco();
    }

    componentWillUnmount(): void {
        this.textEditor?.editor.document.dispose();
        this.textEditor?.dispose();
    }

    componentDidUpdate(oldProps: EmbeddedTextEditorProps) {
        if (!isEqual(this.props.markers, oldProps.markers))
            this.updateMarkers();
    }

    private getWidth() {
        if (!this.props.width)
            return undefined;
        return typeof this.props.width === "string" ? this.props.width : `${this.props.width}px`;
    }

    private getHeight() {
        if (!this.props.height)
            return undefined;
        return typeof this.props.height === "string" ? this.props.height : `${this.props.height}px`;
    }

    private async initMonaco() {
        this.textEditor = await this.props.provider({
            initialContent: this.props.initialContent || "",
            editorOptions: this.props.editorOptions,
            languageId: this.props.languageId
        });
        if (this.containerRef.current) {
            this.containerRef.current.append(this.textEditor.node);
            this.textEditor.node.style.width = "100%";
            this.textEditor.node.style.height = "100%";
            this.textEditor.editor.setSize(this.containerRef.current.getBoundingClientRect());
            this.updateMarkers();
            if (this.props.focusOnMount)
                this.textEditor.editor.focus();
            if (this.props.onContentChanged)
                this.textEditor.editor.onDocumentContentChanged(e =>
                    this.props.onContentChanged!(e.document.getText()));
            if (this.props.setContentRef)
                (this.props.setContentRef as React.MutableRefObject<any>).current = (content: string) => {
                    (this.textEditor?.editor as MonacoEditor).getControl().setValue(content);
                    this.props.onContentChanged!(content);
                };
        }
    }

    render(): React.ReactNode {
        const style = {
            width: this.getWidth(),
            height: this.getHeight()
        };
        return <div className="embedded-text-editor" ref={this.containerRef}
            style={style} />;
    }

    private updateMarkers() {
        if (this.props.markers)
            monaco.editor.setModelMarkers((this.textEditor!.editor as MonacoEditor).getControl().getModel()!, "owner", this.props.markers);
        else
            monaco.editor.setModelMarkers((this.textEditor!.editor as MonacoEditor).getControl().getModel()!, "owner", []);
    }
}

export const bindEmbeddedTextEditor = (bind: interfaces.Bind, rebind: interfaces.Rebind) => {
    let count = 0;
    bind(CustomMonacoWorkspace).toSelf().inSingletonScope();
    rebind(MonacoWorkspace).toService(CustomMonacoWorkspace);
    bind(EmbeddedTextEditorProvider)
        .toProvider(ctx => async (options: EmbeddedTextEditorOptions) => {
            const textEditorProvider = ctx.container.get<TextEditorProvider>(TextEditorProvider);
            count++;
            const uri = new URI(`${MartiniResourceResolver.INMEMORY_SCHEME}:/embedded/${count}?${options.initialContent || ""}`);
            const textEditor = await textEditorProvider(uri);

            if (options.editorOptions)
                (textEditor as MonacoEditor).getControl().updateOptions(options.editorOptions);
            if (options.languageId)
                textEditor.setLanguage(options.languageId);
            const editorWidget = new EditorWidget(textEditor, ctx.container.get(SelectionService));
            Object.assign(editorWidget, {
                selectionService: {}
            });
            editorWidget.onDispose(() => textEditor.document.dispose());
            return editorWidget;
        });
};

export namespace EmbeddedTextEditor {

    export function setContent(editor: EditorWidget, content: string) {
        if (editor)
            (editor.editor as MonacoEditor).getControl().setValue(content);
    }
    export function updateOptions(editor: EditorWidget, options: IEditorOptions) {
        if (editor)
            (editor.editor as MonacoEditor).getControl().updateOptions(options);
    }

    export function getModel(editor: EditorWidget): monaco.editor.ITextModel {
        return (editor.editor as MonacoEditor).getControl().getModel()!;
    }

}
