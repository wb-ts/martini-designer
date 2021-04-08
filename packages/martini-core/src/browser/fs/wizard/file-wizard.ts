import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { codeDirRegExp, codeDirResourceRegExp, packageDirRegExp } from "../../../common/fs/file-util";
import { Wizard } from "../../wizard/wizard";
import { WizardContribution } from "../../wizard/wizard-contribution";
import { DefaultFileWizardFactory } from "./base-file-wizard";
import { FileWizardHelper } from "./file-wizard-helper";

@injectable()
export class FileWizardContribution implements WizardContribution {
    @inject(FileWizardHelper)
    private readonly wizardHelper: FileWizardHelper;
    @inject("Factory<DefaultFileWizard>")
    private readonly fileWizardFactory: DefaultFileWizardFactory;

    readonly id = "file";
    readonly wizardType = "new";
    readonly label = messages.file;
    readonly description = messages.create_file;
    readonly iconClass = "martini-icon martini-file-icon";
    readonly keybinding = "ctrlcmd+alt+n i";
    readonly primary = true;

    async createWizard(): Promise<Wizard> {
        return this.fileWizardFactory({
            title: messages.create_file_title,
            defaultName: "file.txt"
        });
    }

    isVisible() {
        const targetDirectoryPath = this.wizardHelper.getTargetDirectoryPath();
        return (
            targetDirectoryPath !== undefined &&
            !codeDirRegExp.test(targetDirectoryPath) &&
            !codeDirResourceRegExp.test(targetDirectoryPath) &&
            !packageDirRegExp.test(targetDirectoryPath)
        );
    }
}
