import {
    Command,
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    SelectionService
} from "@theia/core";
import { ApplicationShell, CommonCommands } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import {
    DatabaseConnection,
    MartiniDatabaseConnectionManager
} from "../../common/database-connection/martini-database-connection-manager";
import { ConfirmDialog, createListMessage } from "../dialogs/dialogs";
import { DeleteCommand } from "../martini-ide-contribution";
import { NAVIGATOR_VIEW_CONTEXT_MENU } from "../navigator/martini-navigator-view-contribution";
import { ProgressService } from "../progress/progress-service";
import { DatabaseConnectionEditor } from "./editor/database-connection-editor";

export const DATABASE_CATEGORY = "Database";

export const StartDatabaseConnectionCommand: Command = {
    id: "martini.startDatabaseConnection",
    label: messages.start,
    iconClass: "martini-icon martini-database-connection-start-icon",
    category: DATABASE_CATEGORY
};

export const StopDatabaseConnectionCommand: Command = {
    id: "martini.stopDatabaseConnection",
    label: messages.stop,
    iconClass: "martini-icon martini-database-connection-stop-icon",
    category: DATABASE_CATEGORY
};

@injectable()
export class DatabaseConnectionCommandContribution implements CommandContribution {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    @inject(ProgressService)
    private readonly progressService: ProgressService;
    @inject(MartiniDatabaseConnectionManager)
    private readonly dbConnectionManager: MartiniDatabaseConnectionManager;
    @inject(ApplicationShell)
    private readonly shell: ApplicationShell;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(StartDatabaseConnectionCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isDbConnectionSelection(selection)) {
                    const connections = selection.filter(c => c.status !== "STARTED");

                    const dlg = new ConfirmDialog({
                        title:
                            connections.length > 1
                                ? messages.start_multi_db_connections
                                : messages.start_single_db_connection,
                        msg:
                            connections.length <= 1
                                ? messages.start_single_db_connection_question(connections[0].name)
                                : createListMessage(
                                      messages.start_multi_db_connections_question,
                                      connections.map(c => c.name)
                                  ),
                        ok: messages.start
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.starting_db_connection, async progress => {
                            let count = 1;
                            for (const connection of connections) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: connection.name,
                                    work: { done: count++, total: connections.length }
                                });
                                await this.dbConnectionManager.start(connection.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => c.status !== "STARTED");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => c.status !== "STARTED");
            }
        });
        commands.registerCommand(StopDatabaseConnectionCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isDbConnectionSelection(selection)) {
                    const connections = selection.filter(c => c.status !== "STOPPED");
                    const warning = !connections.some(c => CORE_DB_CONNECTIONS.includes(c.name))
                        ? ""
                        : messages.deleting_core_db_connection_warning;
                    const dlg = new ConfirmDialog({
                        title:
                            connections.length > 1
                                ? messages.stop_multi_db_connections
                                : messages.stop_single_db_connection,
                        msg:
                            connections.length <= 1
                                ? messages.stop_single_db_connection_question(connections[0].name) + " " + warning
                                : createListMessage(
                                      messages.stop_multi_db_connections_question + " " + warning,
                                      connections.map(c => c.name)
                                  ),
                        ok: messages.stop
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.stopping_db_connection, async progress => {
                            let count = 1;
                            for (const connection of connections) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: connection.name,
                                    work: { done: count++, total: connections.length }
                                });
                                await this.dbConnectionManager.stop(connection.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => c.status !== "STOPPED");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => c.status !== "STOPPED");
            }
        });
        commands.registerHandler(DeleteCommand.id, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isDbConnectionSelection(selection)) {
                    const connections = selection.filter(c => !CORE_DB_CONNECTIONS.includes(c.name));

                    const dlg = new ConfirmDialog({
                        title:
                            connections.length > 1
                                ? messages.delete_multi_db_connections
                                : messages.delete_single_db_connection,
                        msg:
                            connections.length <= 1
                                ? messages.delete_single_db_connection_question(connections[0].name)
                                : createListMessage(
                                      messages.delete_multi_db_connections_question,
                                      connections.map(c => c.name)
                                  ),
                        ok: messages.stop
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.deleting_db_connection, async progress => {
                            let count = 1;
                            for (const connection of connections) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: connection.name,
                                    work: { done: count++, total: connections.length }
                                });
                                await this.dbConnectionManager.delete(connection.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => !CORE_DB_CONNECTIONS.includes(c.name));
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isDbConnectionSelection(selection) && selection.some(c => !CORE_DB_CONNECTIONS.includes(c.name));
            }
        });
        const findHandler = {
            execute: () => {
                if (this.shell.currentWidget instanceof DatabaseConnectionEditor)
                    this.shell.currentWidget.showSearchBox();
            },
            isEnabled: () => this.shell.currentWidget instanceof DatabaseConnectionEditor
        };
        commands.registerHandler(CommonCommands.FIND.id, findHandler);
        commands.registerHandler("actions.find", findHandler);
    }
}

export const isDbConnectionSelection = (selection: any): selection is DatabaseConnection[] => {
    return selection instanceof Array && selection.find(e => DatabaseConnection.is(e));
};

const CORE_DB_CONNECTIONS = ["coder", "flux", "tracker", "config", "monitor"];

@injectable()
export class DatabaseConnectionMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StartDatabaseConnectionCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StopDatabaseConnectionCommand.id
        });
    }
}
