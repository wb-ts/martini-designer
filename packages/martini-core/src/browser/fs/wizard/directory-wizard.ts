import { SelectionService } from "@theia/core";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { codeDirRegExp, codeDirResourceRegExp } from "../../../common/fs/file-util";
import { isPackageSelection } from "../../package/martini-package-contribution";
import { Wizard } from "../../wizard/wizard";
import { WizardContribution } from "../../wizard/wizard-contribution";
import { DefaultFileWizardFactory } from "./base-file-wizard";
import { FileWizardHelper } from "./file-wizard-helper";

@injectable()
export class DirectoryWizardContribution implements WizardContribution {
    @inject(FileWizardHelper)
    private readonly wizardHelper: FileWizardHelper;
    @inject("Factory<DefaultFileWizard>")
    private readonly fileWizardFactory: DefaultFileWizardFactory;
    @inject(SelectionService)
    private readonly selectionService: SelectionService;

    readonly id = "directory";
    readonly wizardType = "new";
    readonly label = messages.directory;
    readonly description = messages.create_directory;
    readonly iconClass = "martini-icon martini-directory-icon";
    readonly keybinding = "ctrlcmd+alt+n d";
    readonly primary = true;

    async createWizard(): Promise<Wizard> {
        return this.fileWizardFactory({
            title: messages.create_directory_title,
            defaultName: "newDir",
            dir: true
        });
    }

    isVisible() {
        const selection = this.selectionService.selection;

        if (isPackageSelection(selection)) return selection.some(p => p.status !== "UNLOADED" && p.name !== "core");

        const targetDirectoryPath = this.wizardHelper.getTargetDirectoryPath();
        return (
            targetDirectoryPath !== undefined &&
            !codeDirRegExp.test(targetDirectoryPath) &&
            !codeDirResourceRegExp.test(targetDirectoryPath)
        );
    }
}
