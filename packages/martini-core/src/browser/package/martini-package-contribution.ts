import {
    Command,
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    SelectionService
} from "@theia/core";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { MartiniPackageManager, PartialMartiniPackage } from "../../common/package/martini-package-manager";
import { ConfirmDialog, createListMessage } from "../dialogs/dialogs";
import { DeleteCommand } from "../martini-ide-contribution";
import { NAVIGATOR_VIEW_CONTEXT_MENU } from "../navigator/martini-navigator-view-contribution";
import { ProgressService } from "../progress/progress-service";

export const PACKAGE_CATEGORY = "Package";

export const StartPackageCommand: Command = {
    id: "martini.startPackage",
    label: messages.start,
    iconClass: "martini-icon martini-package-start-icon",
    category: PACKAGE_CATEGORY
};

export const StopPackageCommand: Command = {
    id: "martini.stopPackage",
    label: messages.stop,
    iconClass: "martini-icon martini-package-stop-icon",
    category: PACKAGE_CATEGORY
};

export const LoadPackageCommand: Command = {
    id: "martini.loadPackage",
    label: messages.load,
    iconClass: "martini-icon martini-package-load-icon",
    category: PACKAGE_CATEGORY
};

export const UnloadPackageCommand: Command = {
    id: "martini.unloadPackage",
    label: messages.unload,
    iconClass: "martini-icon martini-package-unload-icon",
    category: PACKAGE_CATEGORY
};

export const RestartPackageCommand: Command = {
    id: "martini.restartPackage",
    label: messages.restart,
    iconClass: "martini-icon martini-package-start-icon",
    category: PACKAGE_CATEGORY
};

@injectable()
export class MartiniPackageCommandContribution implements CommandContribution {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    @inject(MartiniPackageManager)
    private readonly  packageManager: MartiniPackageManager;
    @inject(ProgressService)
    private readonly  progressService: ProgressService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(StartPackageCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.status !== "STARTED" && pckage.name !== "core");

                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.start_multi_packages : messages.start_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.start_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.start_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.start
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.starting_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.start(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status !== "STARTED" && pckage.name !== "core")
                );
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status !== "STARTED" && pckage.name !== "core")
                );
            }
        });
        commands.registerCommand(StopPackageCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.status === "STARTED" && pckage.name !== "core");
                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.stop_multi_packages : messages.stop_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.stop_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.stop_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.stop
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.stopping_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.stop(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "STARTED" && pckage.name !== "core")
                );
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "STARTED" && pckage.name !== "core")
                );
            }
        });
        commands.registerCommand(UnloadPackageCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.status !== "UNLOADED" && pckage.name !== "core");
                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.unload_multi_packages : messages.unload_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.unload_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.unload_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.unload
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.unloading_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.unload(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status !== "UNLOADED" && pckage.name !== "core")
                );
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status !== "UNLOADED" && pckage.name !== "core")
                );
            }
        });
        commands.registerCommand(LoadPackageCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.status === "UNLOADED" && pckage.name !== "core");
                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.load_multi_packages : messages.load_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.load_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.load_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.load
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.loading_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.load(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "UNLOADED" && pckage.name !== "core")
                );
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "UNLOADED" && pckage.name !== "core")
                );
            }
        });
        commands.registerCommand(RestartPackageCommand, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.status === "STARTED" && pckage.name !== "core");
                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.restart_multi_packages : messages.restart_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.restart_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.restart_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.restart
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.restarting_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.restart(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "STARTED" && pckage.name !== "core")
                );
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return (
                    isPackageSelection(selection) &&
                    selection.some(pckage => pckage.status === "STARTED" && pckage.name !== "core")
                );
            }
        });
        commands.registerHandler(DeleteCommand.id, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (isPackageSelection(selection)) {
                    const packages = selection.filter(pckage => pckage.name !== "core");
                    const dlg = new ConfirmDialog({
                        title: packages.length > 1 ? messages.delete_multi_packages : messages.delete_single_package,
                        msg:
                            packages.length <= 1
                                ? messages.delete_single_package_question(packages[0].name)
                                : createListMessage(
                                      messages.delete_multi_packages_question,
                                      packages.map(p => p.name)
                                  ),
                        ok: messages.delete
                    });

                    const confirmed = await dlg.open();
                    if (confirmed) {
                        await this.progressService.showProgress(messages.deleting_package, async progress => {
                            let count = 1;
                            for (const pckage of packages) {
                                if (progress.isCancelled()) break;
                                progress.report({
                                    message: pckage.name,
                                    work: { done: count++, total: packages.length }
                                });
                                await this.packageManager.delete(pckage.name);
                            }
                        });
                    }
                }
            },
            isEnabled: () => {
                const selection = this.selectionService.selection;
                return isPackageSelection(selection) && selection.some(pckage => pckage.name !== "core");
            },
            isVisible: () => {
                const selection = this.selectionService.selection;
                return isPackageSelection(selection) && selection.some(pckage => pckage.name !== "core");
            }
        });
    }
}

export const isPackageSelection = (selection: any): selection is PartialMartiniPackage[] => {
    return selection instanceof Array && selection.every(e => PartialMartiniPackage.is(e));
};

@injectable()
export class MartiniPackageMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StartPackageCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: StopPackageCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: LoadPackageCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: UnloadPackageCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: RestartPackageCommand.id
        });
    }
}
