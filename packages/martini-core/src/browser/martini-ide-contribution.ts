import {
    Command,
    CommandContribution,
    CommandRegistry,
    MAIN_MENU_BAR,
    MenuContribution,
    MenuModelRegistry
} from "@theia/core";
import {
    ApplicationShell,
    CommonCommands,
    KeybindingContribution,
    KeybindingRegistry,
    OpenerService
} from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { HistoryManagerProvider } from "./history/history-manager";
import URI from "@theia/core/lib/common/uri";

export const DeleteCommand: Command = {
    id: "martini.delete",
    label: messages.delete,
    iconClass: "martini-icon martini-delete-icon"
};

export const RenameCommand: Command = {
    id: "martini.rename",
    label: messages.rename,
    iconClass: "martini-icon martini-edit-icon"
};

export const EditCommand: Command = {
    id: "martini.edit",
    label: messages.edit,
    iconClass: "martini-icon martini-edit-icon"
};

export const CopyPathCommand: Command = {
    id: "martini.copyPath",
    label: messages.copy_path,
    iconClass: "martini-icon martini-copy-icon"
};

export const CopyNamespaceCommand: Command = {
    id: "martini.copyNamespace",
    label: messages.copy_namespace,
    iconClass: "martini-icon martini-copy-icon"
};

export type MoveDirection = "left" | "right" | "up" | "down";

export const MoveLeftCommand: Command = {
    id: "martini.moveLeft",
    label: messages.move_left,
    iconClass: "martini-icon martini-arrow-left-icon"
};

export const MoveRightCommand: Command = {
    id: "martini.moveRight",
    label: messages.move_right,
    iconClass: "martini-icon martini-arrow-right-icon"
};

export const MoveUpCommand: Command = {
    id: "martini.moveUp",
    label: messages.move_up,
    iconClass: "martini-icon martini-arrow-up-icon"
};

export const MoveDownCommand: Command = {
    id: "martini.moveDown",
    label: messages.move_down,
    iconClass: "martini-icon martini-arrow-down-icon"
};

export const EditMartiniPropertiesCommand: Command = {
    id: "martini.editMartiniProperties",
    label: messages.edit_martini_properties,
    iconClass: "martini-icon martini-edit-icon"
};

export const EditComments: Command = {
    id: "martini.editComments",
    label: messages.edit_comments,
    iconClass: "martini-icon martini-comments-icon"
};

export const ToggleEnabled: Command = {
    id: "martini.toggleEnabled",
    label: messages.toggle_enabled,
    iconClass: "martini-icon martini-disabled-icon"
};

export namespace MartiniMenus {
    export const MARTINI = [...MAIN_MENU_BAR, "0_martini"];
}

@injectable()
export class MartiniIdeCommandContribution implements CommandContribution {
    @inject(ApplicationShell)
    private readonly shell: ApplicationShell;
    @inject(OpenerService)
    private readonly openerService: OpenerService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(DeleteCommand);
        commands.registerCommand(RenameCommand);
        commands.registerCommand(CopyPathCommand);
        commands.registerCommand(CopyNamespaceCommand);
        commands.registerCommand(MoveLeftCommand);
        commands.registerCommand(MoveRightCommand);
        commands.registerCommand(MoveUpCommand);
        commands.registerCommand(MoveDownCommand);
        commands.registerCommand(EditComments);
        commands.registerCommand(ToggleEnabled);
        commands.registerCommand(EditCommand);
        CommonCommands.COPY.iconClass = "martini-icon martini-copy-icon";
        CommonCommands.CUT.iconClass = "martini-icon martini-cut-icon";
        CommonCommands.PASTE.iconClass = "martini-icon martini-paste-icon";
        CommonCommands.FIND.iconClass = "martini-icon martini-search-icon";

        const isTextElementFocused = () => {
            const activeElement = document.activeElement;
            return (
                (activeElement instanceof HTMLInputElement && activeElement.type === "text") ||
                activeElement instanceof HTMLTextAreaElement
            );
        };
        commands.registerHandler(CommonCommands.UNDO.id, {
            execute: () => {
                document.execCommand("undo", true);
            },
            isEnabled: isTextElementFocused
        });
        commands.registerHandler(CommonCommands.REDO.id, {
            execute: () => {
                document.execCommand("redo", true);
            },
            isEnabled: isTextElementFocused
        });
        commands.registerHandler(CommonCommands.UNDO.id, {
            execute: () => {
                const widget = this.shell.currentWidget;
                return HistoryManagerProvider.is(widget) && widget.historyManager?.undo();
            },
            isEnabled: () => {
                const widget = this.shell.currentWidget;
                return (
                    HistoryManagerProvider.is(widget) &&
                    widget.historyManager !== undefined &&
                    widget.historyManager.canUndo()
                );
            }
        });
        commands.registerHandler(CommonCommands.REDO.id, {
            execute: () => {
                const widget = this.shell.currentWidget;
                return HistoryManagerProvider.is(widget) && widget.historyManager?.redo();
            },
            isEnabled: () => {
                const widget = this.shell.currentWidget;
                return (
                    HistoryManagerProvider.is(widget) &&
                    widget.historyManager !== undefined &&
                    widget.historyManager.canRedo()
                );
            }
        });
        commands.registerCommand(EditMartiniPropertiesCommand, {
            execute: async () => {
                const uri: URI = new URI("martini://core/conf/properties/application.properties");
                const handler = await this.openerService.getOpener(uri);
                return handler.open(uri);
            }
        });
    }
}

@injectable()
export class MartiniMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu(MartiniMenus.MARTINI, "Martini");
        menus.registerMenuAction(MartiniMenus.MARTINI, {
            commandId: EditMartiniPropertiesCommand.id
        });
    }
}

@injectable()
export class MartiniIdeKeybindingContribution implements KeybindingContribution {
    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybindings(
            {
                command: DeleteCommand.id,
                keybinding: "del"
            },
            {
                command: RenameCommand.id,
                keybinding: "f2"
            },
            {
                command: EditCommand.id,
                keybinding: "ctrlcmd+enter"
            },
            {
                command: CopyPathCommand.id,
                keybinding: "ctrlcmd+shift+C"
            },
            {
                command: CopyNamespaceCommand.id,
                keybinding: "ctrlcmd+alt+shift+C"
            },
            {
                command: CommonCommands.PASTE.id,
                keybinding: "ctrlcmd+V"
            },
            {
                command: MoveLeftCommand.id,
                keybinding: "ctrlcmd+left"
            },
            {
                command: MoveRightCommand.id,
                keybinding: "ctrlcmd+right"
            },
            {
                command: MoveUpCommand.id,
                keybinding: "ctrlcmd+up"
            },
            {
                command: MoveDownCommand.id,
                keybinding: "ctrlcmd+down"
            },
            {
                command: EditComments.id,
                keybinding: "ctrlcmd+/"
            },
            {
                command: ToggleEnabled.id,
                keybinding: "alt+/"
            }
        );
    }
}
