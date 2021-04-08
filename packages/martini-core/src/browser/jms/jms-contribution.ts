import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from "@theia/core";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { MartiniMenus } from "../martini-ide-contribution";
import { MARTINI_IDE_CATEGORY } from "../navigator/martini-navigator-view-contribution";
import { SendJmsMessageDialog, SendJmsMessageDialogProps } from "./send-jms-message-dialog";

export const SendJmsMessageCommand: Command = {
    id: "martini.sendJmsMessage",
    label: messages.send_jms_message,
    iconClass: "martini-icon martini-send-jms-message-icon",
    category: MARTINI_IDE_CATEGORY
};

@injectable()
export class JmsCommandContribution implements CommandContribution {
    @inject("Factory<SendJmsMessageDialog>")
    private readonly sendJmsMessageDialog: (props: SendJmsMessageDialogProps) => SendJmsMessageDialog;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SendJmsMessageCommand, {
            execute: async () => await this.sendJmsMessageDialog({}).open()
        });
    }
}

@injectable()
export class JmsMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(MartiniMenus.MARTINI, {
            commandId: SendJmsMessageCommand.id
        });
    }
}
