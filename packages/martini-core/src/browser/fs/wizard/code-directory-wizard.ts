import { injectable } from "inversify";
import { AbstractCodeFileWizardContribution, DefaultFileWizardProps } from "./base-file-wizard";
import messages from "martini-messages/lib/messages";

@injectable()
export class CodeDirectoryWizardContribution extends AbstractCodeFileWizardContribution {
    readonly id = "code-directory";
    readonly wizardType = "new";
    readonly label = messages.code_dir_title;
    readonly description = messages.create_new_code_dir;
    readonly iconClass = "martini-icon martini-code-directory-icon";
    readonly keybinding = "ctrlcmd+alt+n c";
    readonly primary = true;
    readonly menuGroup = "5_misc"

    protected getFileWizardProps(): DefaultFileWizardProps {
        return {
            title: messages.create_code_dir_title,
            defaultName: "newDir",
            dir: true
        };
    }
}
