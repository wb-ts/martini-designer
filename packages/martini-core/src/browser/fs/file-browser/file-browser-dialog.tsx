import { AbstractDialog, DialogProps, Message, Panel, Widget } from "@theia/core/lib/browser";
import { inject, injectable, interfaces } from "inversify";
import messages from "martini-messages/lib/messages";
import { Directory } from "../../../common/fs/martini-filesystem";
import { applySize } from "../../dialogs/dialogs";
import { createFileTreeContainer, FileTreeWidget, ResourceFilter } from "./file-tree-widget";

export const FileBrowserDialogProps = Symbol("FileBrowserDialogProps");

export interface FileBrowserDialogProps extends DialogProps {
    resourceFilter?: ResourceFilter;
}

@injectable()
export class FileBrowserDialog extends AbstractDialog<string> {
    private selectedPath: string;
    private readonly contentPanel: Panel;

    constructor(
        @inject(FileBrowserDialogProps) props: FileBrowserDialogProps,
        @inject("Factory<FileTreeWidget>")
        fileTreeFactory: () => FileTreeWidget
    ) {
        super(props);
        this.contentPanel = new Panel();
        this.contentPanel.addClass("full-height");
        const fileTree = fileTreeFactory();
        fileTree.treeContentProvider.resourceFilter = props.resourceFilter;
        fileTree.addClass("full-height");
        fileTree.addClass("theia-FileTree");
        fileTree.addClass("theia-FileDialog");
        this.toDispose.pushAll([
            fileTree,
            fileTree.model.onOpenElement(this.handleElementOpened),
            fileTree.model.onTreeSelectionChanged(this.handleTreeSelectionChanged)
        ]);
        fileTree.show();
        this.contentPanel.addWidget(fileTree);
        this.contentNode.classList.add("full-height");
        applySize(this.contentNode, { height: 300 });
        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.select_btn);
        this.update();
    }

    get value(): string {
        return this.selectedPath;
    }

    protected isValid(value: string, mode: "open" | "preview") {
        if (!value || value.trim().length === 0)
            return messages.directory_must_be_selected;
        return true;
    }

    protected onAfterAttach(msg: Message): void {
        Widget.attach(this.contentPanel, this.contentNode);
        super.onAfterAttach(msg);
    }

    private handleTreeSelectionChanged = (selection: any[]) => {
        if (selection.length === 1) {
            const selected = selection[0];

            if (Directory.is(selected)) {
                this.selectedPath = selected.location;
                this.update();
                return;
            }
        }

        this.selectedPath = "";
        this.update();
    };

    private handleElementOpened = (element: any) => {
        if (Directory.is(element)) {
            this.selectedPath = element.location;
            this.accept();
            return;
        }
    };
}

export const bindFileBrowserDialog = (bind: interfaces.Bind) => {
    bind("Factory<FileTreeWidget>").toFactory(ctx => () => {
        const child = createFileTreeContainer(ctx.container);
        return child.get(FileTreeWidget);
    });

    bind("Factory<FileBrowserDialog>").toFactory(ctx => (props: Partial<FileBrowserDialogProps>) => {
        const child = ctx.container.createChild();
        child.bind(FileBrowserDialogProps).toConstantValue({
            title: messages.select_directory_title,
            ...props
        });
        child.bind(FileBrowserDialog).toSelf().inSingletonScope();
        return child.get(FileBrowserDialog);
    });
};
