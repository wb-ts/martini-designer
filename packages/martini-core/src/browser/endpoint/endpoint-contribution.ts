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
import { MartiniEndpoint, MartiniEndpointManager } from "../../common/endpoint/martini-endpoint-manager";
import { ConfirmDialog, createListMessage } from "../dialogs/dialogs";
import { DeleteCommand } from "../martini-ide-contribution";
import { NAVIGATOR_VIEW_CONTEXT_MENU } from "../navigator/martini-navigator-view-contribution";
import { ProgressService } from "../progress/progress-service";
import { EndpointEditor } from "./editor/endpoint-editor";

export const ENDPOINT_CATEGORY = "Endpoint";

export const StartEndpointCommand: Command = {
    id: "martini.startEndpoint",
    label: messages.start,
    iconClass: "martini-icon martini-endpoint-start-icon",
    category: ENDPOINT_CATEGORY
};

export const StopEndpointCommand: Command = {
    id: "martini.stopEndpoint",
    label: messages.stop,
    iconClass: "martini-icon martini-endpoint-stop-icon",
    category: ENDPOINT_CATEGORY
};

@injectable()
export class EndpointCommandContribution implements CommandContribution {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    @inject(MartiniEndpointManager)
    private readonly endpointManager: MartiniEndpointManager;
    @inject(ProgressService)
    private readonly progressService: ProgressService;
    @inject(ApplicationShell)
    private readonly shell: ApplicationShell;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(StartEndpointCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isEndpointSelection(selection)) {
                    const endpoints = selection.filter(e => e.status !== "STARTED");

                    const dlg = new ConfirmDialog({
                        title: endpoints.length > 1 ? messages.start_multi_endpoints : messages.start_single_endpoint,
                        msg:
                            endpoints.length <= 1
                                ? messages.start_single_endpoint_question(endpoints[0].name)
                                : createListMessage(
                                      messages.start_multi_endpoints_question,
                                      endpoints.map(e => e.name)
                                  ),
                        ok: messages.start
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.starting_endpoint, async progress => {
                            let count = 1;
                            for (const endpoint of endpoints) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: endpoint.name,
                                    work: { done: count++, total: endpoints.length }
                                });
                                await this.endpointManager.start(endpoint.packageName, endpoint.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.status === "STOPPED");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.status === "STOPPED");
            }
        });
        commands.registerCommand(StopEndpointCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isEndpointSelection(selection)) {
                    const endpoints = selection.filter(e => e.status !== "STOPPED");

                    const dlg = new ConfirmDialog({
                        title: endpoints.length > 1 ? messages.stop_multi_endpoints : messages.stop_single_endpoint,
                        msg:
                            endpoints.length <= 1
                                ? messages.stop_single_endpoint_question(endpoints[0].name)
                                : createListMessage(
                                      messages.stop_multi_endpoints_question,
                                      endpoints.map(e => e.name)
                                  ),
                        ok: messages.stop
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.stopping_endpoint, async progress => {
                            let count = 1;
                            for (const endpoint of endpoints) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: endpoint.name,
                                    work: { done: count++, total: endpoints.length }
                                });
                                await this.endpointManager.stop(endpoint.packageName, endpoint.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.status === "STARTED");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.status === "STARTED");
            }
        });
        commands.registerHandler(DeleteCommand.id, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isEndpointSelection(selection)) {
                    const endpoints = selection.filter(e => e.packageName !== "core");

                    const dlg = new ConfirmDialog({
                        title: endpoints.length > 1 ? messages.delete_multi_endpoints : messages.delete_single_endpoint,
                        msg:
                            endpoints.length <= 1
                                ? messages.delete_single_endpoint_question(endpoints[0].name)
                                : createListMessage(
                                      messages.delete_multi_endpoints_question,
                                      endpoints.map(e => e.name)
                                  ),
                        ok: messages.delete
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.deleting_endpoint, async progress => {
                            let count = 1;
                            for (const endpoint of endpoints) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: endpoint.name,
                                    work: { done: count++, total: endpoints.length }
                                });
                                await this.endpointManager.delete(endpoint.packageName, endpoint.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.packageName !== "core");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isEndpointSelection(selection) && selection.some(e => e.packageName !== "core");
            }
        });

        const findHandler = {
            execute: () => {
                if (this.shell.currentWidget instanceof EndpointEditor) this.shell.currentWidget.showSearchBox();
            },
            isEnabled: () => this.shell.currentWidget instanceof EndpointEditor
        };
        commands.registerHandler(CommonCommands.FIND.id, findHandler);
        commands.registerHandler("actions.find", findHandler);
    }
}

export const isEndpointSelection = (selection: any): selection is MartiniEndpoint[] => {
    return selection instanceof Array && selection.find(e => MartiniEndpoint.is(e));
};

@injectable()
export class EndpointMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StartEndpointCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StopEndpointCommand.id
        });
    }
}
