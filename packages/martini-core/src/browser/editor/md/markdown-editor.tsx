import { EmbeddedTextEditor, EmbeddedTextEditorProvider } from "../embedded-text-editor";
import * as React from "react";
import { SplitPanel } from "../../components/widget";
import * as showdown from "showdown";
import { debounce } from "lodash";
import { EditorWidget } from "@theia/editor/lib/browser";
import IEditorOptions = monaco.editor.IEditorOptions;
import { ReactDialog } from "@theia/core/lib/browser/dialogs/react-dialog";
import { injectable, inject, interfaces } from "inversify";
import { DialogProps } from "@theia/core/lib/browser";
import { ToolBar, ToolBarItem } from "../../components/toolbar";
import messages from "martini-messages/lib/messages";

export type MarkdownEditorLayout = "sourceAndPreview" | "sourceOnly" | "previewOnly";
export type MarkdownEditorOrientation = "vertical" | "horizontal";

export interface MarkdownEditorProps {
    textEditorProvider: EmbeddedTextEditorProvider;
    layout?: MarkdownEditorLayout;
    orientation?: MarkdownEditorOrientation;
    content?: string;
    relativeSizes?: number[];
    readOnly?: boolean;
    focusOnMount?: boolean;
    onContentChange?: (content: string) => void;
    onRelativeSizesChange?: (relativeSizes: number[]) => void;
}

interface MarkdownEditorState {
    preview: string;
}

export class MarkdownEditor extends React.Component<MarkdownEditorProps, MarkdownEditorState> {
    private converter: showdown.Converter;
    private editor: EditorWidget;
    private mounted = false;
    private skipNextContentChangeEvent = false;

    constructor(props: MarkdownEditorProps) {
        super(props);
        this.converter = new showdown.Converter();
        this.state = {
            preview: this.props.content ? this.converter.makeHtml(this.props.content) : ""
        };
    }

    render(): React.ReactNode {
        const children = [() => this.makeMarkdownEditor(), this.makePreview()];
        const visibilities = [true, true];
        switch (this.props.layout || "sourceAndPreview") {
            case "sourceOnly":
                children.push(() => this.makeMarkdownEditor());
                visibilities[1] = false;
                break;
            case "previewOnly":
                children.push(this.makePreview());
                visibilities[0] = false;
                break;
        }

        return <SplitPanel splitChildren={children}
            sizes={this.props.relativeSizes}
            visibilities={visibilities}
            orientation={this.props.orientation || "vertical"}
            onRelativeSizesChange={this.props.onRelativeSizesChange} />;
    }

    componentDidMount(): void {
        this.mounted = true;
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    componentDidUpdate(prevProps: Readonly<MarkdownEditorProps>): void {
        if (this.props.readOnly !== prevProps.readOnly)
            EmbeddedTextEditor.updateOptions(this.editor, this.getEditorOptions());
        if (prevProps.content !== this.props.content &&
            this.editor && this.editor.editor.document.getText() !== this.props.content) {
            this.skipNextContentChangeEvent = true;
            EmbeddedTextEditor.setContent(this.editor, this.props.content || "");
            this.updatePreview(this.props.content || "");
        }
    }

    private handleContentChange(content: string) {
        if (!this.skipNextContentChangeEvent && this.props.onContentChange) this.props.onContentChange(content);
        this.skipNextContentChangeEvent = false;
    }

    readonly updatePreview = (source: string) => {
        if (this.mounted) {
            const html = this.converter.makeHtml(source);
            this.setState({
                ...this.state,
                preview: html
            });
        }
    };

    readonly updatePreviewDebounced = debounce(this.updatePreview, 1000);

    private async makeMarkdownEditor() {
        if (this.editor)
            return this.editor;
        this.editor = await this.props.textEditorProvider({
            initialContent: this.props.content,
            languageId: "markdown",
            editorOptions: this.getEditorOptions()
        });
        this.editor.editor.onDocumentContentChanged(e => {
            const text = e.document.getText();
            this.updatePreviewDebounced(text);
            this.handleContentChange(text);
        });
        if (this.props.focusOnMount !== undefined && this.props.focusOnMount)
            this.editor.activate();
        return this.editor;
    }

    private makePreview() {
        return <div style={{ margin: "4px", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{ __html: this.state.preview }} />;
    }

    private getEditorOptions(): IEditorOptions {
        return {
            glyphMargin: false,
            wordWrap: "bounded",
            lineNumbers: "off",
            readOnly: this.props.readOnly
        };
    }
}

export interface MarkdownEditorToolBarProps {
    layout: MarkdownEditorLayout;
    orientation: MarkdownEditorOrientation;
    onLayoutChange: (layout: MarkdownEditorLayout) => void;
    onOrientationChange: (orientation: MarkdownEditorOrientation) => void;
}

export const MarkdownEditorToolBar: React.FC<MarkdownEditorToolBarProps> = ({
    layout, orientation, onLayoutChange, onOrientationChange
}) => (<ToolBar>
    <ToolBarItem
        iconClass="martini-show-source-only-icon"
        tooltip={messages.show_source_only}
        toggled={() => layout === "sourceOnly"}
        onClick={_ => onLayoutChange("sourceOnly")}
    />
    <ToolBarItem
        iconClass="martini-show-source-and-preview-icon"
        tooltip={messages.show_source_and_preview}
        toggled={() => layout === "sourceAndPreview"}
        onClick={_ => onLayoutChange("sourceAndPreview")}
    />
    <ToolBarItem
        iconClass="martini-show-preview-only-icon"
        tooltip={messages.show_preview_only}
        toggled={() => layout === "previewOnly"}
        onClick={_ => onLayoutChange("previewOnly")}
    />
    <ToolBarItem
        iconClass="martini-layout-icon"
        tooltip={messages.toggle_orientation}
        onClick={_ => {
            const next = orientation === "horizontal" ? "vertical" : "horizontal";
            onOrientationChange(next);
        }}
    />
</ToolBar>);

export interface MarkdownEditorDialogProps extends DialogProps {
    initialContent?: string;
    height?: number;
    width?: number;
}

export const MarkdownEditorDialogProps = Symbol("MarkdownEditorDialogProps");

@injectable()
export class MarkdownEditorDialog extends ReactDialog<string> {
    value: string;
    private mdLayout: MarkdownEditorLayout = "sourceAndPreview";
    private orientation: MarkdownEditorOrientation = "vertical";

    constructor(
        @inject(MarkdownEditorDialogProps) readonly props: MarkdownEditorDialogProps,
        @inject(EmbeddedTextEditorProvider) private readonly textEditorProvider: EmbeddedTextEditorProvider
    ) {
        super(props);
        this.contentNode.style.height = `${props.height || 400}px`;
        this.contentNode.style.width = `${props.width || 500}px`;
        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.apply_btn);
    }

    protected render(): React.ReactNode {
        return <>
            <div style={{ marginBottom: "4px" }}>
                <MarkdownEditorToolBar
                    layout={this.mdLayout}
                    orientation={this.orientation}
                    onLayoutChange={layout => this.handleLayoutChange(layout)}
                    onOrientationChange={orientation => this.handleOrientationChange(orientation)}
                />
            </div>
            <MarkdownEditor
                textEditorProvider={this.textEditorProvider}
                content={this.props.initialContent}
                onContentChange={content => this.value = content}
                layout={this.mdLayout}
                orientation={this.orientation}
                focusOnMount={true}
            />
        </>;
    }

    private handleLayoutChange(layout: MarkdownEditorLayout) {
        if (this.mdLayout === layout)
            return;
        this.mdLayout = layout;
        this.update();
    }

    private handleOrientationChange(orientation: MarkdownEditorOrientation): void {
        if (this.orientation === orientation)
            return;
        this.orientation = orientation;
        this.update();
    }
}

export const bindMarkdownEditorDialog = (bind: interfaces.Bind) => {
    bind("Factory<MarkdownEditorDialog>").toFactory(ctx => (props: MarkdownEditorDialogProps) => {
        const child = ctx.container.createChild();
        child.bind(MarkdownEditorDialogProps).toConstantValue(props);
        child.bind(MarkdownEditorDialog).toSelf();
        return child.get(MarkdownEditorDialog);
    });
};
