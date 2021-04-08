import { CommandContribution, CommandRegistry, Path, SelectionService } from "@theia/core";
import { SingleTextInputDialog } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { filterByParentDir, isModifiable, isResourceArray } from "../../common/fs/file-util";
import { MartiniFileSystem, Resource } from "../../common/fs/martini-filesystem";
import { ConfirmDialog, createListMessage } from "../dialogs/dialogs";
import { DeleteCommand, RenameCommand } from "../martini-ide-contribution";
import { ProgressService } from "../progress/progress-service";
import { DefaultResourceNameValidator } from "./resource-name-validator";

@injectable()
export class MartiniFileSystemCommandContribution implements CommandContribution {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;
    @inject(ProgressService)
    private readonly progressService: ProgressService;
    @inject(DefaultResourceNameValidator)
    private readonly resourceNameValidator: DefaultResourceNameValidator;

    registerCommands(commands: CommandRegistry): void {
        commands.registerHandler(DeleteCommand.id, {
            execute: async () => {
                const selection = this.selectionService.selection;
                if (!isResourceArray(selection)) return;
                const resources = filterByParentDir(selection);
                const dlg = new ConfirmDialog({
                    title: resources.length > 1 ? messages.delete_multi_resources : messages.delete_single_resource,
                    msg:
                        resources.length > 1
                            ? createListMessage(
                                  messages.delete_multi_resources_question,
                                  resources.map(r => r.name)
                              )
                            : messages.delete_single_resource_question(resources[0].location),
                    ok: messages.delete
                });
                if (await dlg.open()) {
                    await this.progressService.showProgress(messages.deleting_resource, async progress => {
                        const count = 1;
                        for (const resource of resources) {
                            if (progress.isCancelled()) break;
                            progress.report({
                                message: resource.name,
                                work: { done: count, total: resources.length }
                            });
                            await this.fileSystem.delete(resource.location);
                        }
                    });
                }
            },
            isEnabled: () =>
                isResourceArray(this.selectionService.selection) &&
                this.selectionService.selection.every(r => isModifiable(r)),
            isVisible: () =>
                isResourceArray(this.selectionService.selection) &&
                this.selectionService.selection.every(r => isModifiable(r))
        });
        commands.registerHandler(RenameCommand.id, {
            execute: async () => {
                const resource = (this.selectionService.selection as Resource[])[0];
                if (!isModifiable(resource)) return;
                const dlg = new SingleTextInputDialog({
                    title: messages.rename_resource,
                    initialValue: resource.name,
                    initialSelectionRange: {
                        start: 0,
                        end: resource.name.lastIndexOf(".") > 0 ? resource.name.lastIndexOf(".") : resource.name.length
                    },
                    confirmButtonLabel: messages.rename,
                    validate: async (input, _) => {
                        if (input === resource.name) return false;
                        return await this.resourceNameValidator.validate(
                            new Path(resource.location).dir.toString(),
                            input
                        );
                    }
                });
                const newName = await dlg.open();
                if (newName) {
                    // TODO Show refactoring dialog
                    await this.progressService.showProgress(
                        messages.renaming_resource(resource.name),
                        async progress => {
                            await this.fileSystem.rename(resource.location, newName);
                        }
                    );
                }
            },
            isEnabled: () =>
                isResourceArray(this.selectionService.selection) &&
                this.selectionService.selection.every(r => isModifiable(r)) &&
                this.selectionService.selection.length === 1,
            isVisible: () =>
                isResourceArray(this.selectionService.selection) &&
                this.selectionService.selection.every(r => isModifiable(r)) &&
                this.selectionService.selection.length === 1
        });
    }
}
