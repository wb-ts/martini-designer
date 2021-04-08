import { Path, SelectionService } from "@theia/core";
import { ApplicationShell, open, OpenerService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { codeDirRegExp, codeDirResourceRegExp, isResourceArray } from "../../../common/fs/file-util";
import { MartiniFileSystem } from "../../../common/fs/martini-filesystem";
import { MartiniPackageManager } from "../../../common/package/martini-package-manager";
import { isPackageSelection } from "../../package/martini-package-contribution";
import { ProgressService } from "../../progress/progress-service";

@injectable()
export class FileWizardHelper {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    @inject(ApplicationShell)
    private readonly shell: ApplicationShell;
    @inject(MartiniPackageManager)
    private readonly packageManager: MartiniPackageManager;
    @inject(OpenerService)
    private readonly opener: OpenerService;
    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;
    @inject(ProgressService)
    private readonly progressService: ProgressService;

    getTargetDirectoryPath(): string | undefined {
        const currentWidget = this.shell.currentWidget;
        if (currentWidget && this.hasUri(currentWidget) && currentWidget.uri)
            return new Path(currentWidget.uri.path.toString()).dir.toString();

        const selection = this.selectionService.selection;

        if (
            isPackageSelection(selection) &&
            selection.length !== 0 &&
            selection[0].status !== "UNLOADED" &&
            selection[0].name !== "core"
        )
            return "/" + selection[0].name;

        if (selection && isResourceArray(this.selectionService.selection)) {
            const selectedResource = this.selectionService.selection[0];
            if (selectedResource.directory) return selectedResource.location;
            else return new Path(selectedResource.location).dir.toString();
        }

        return undefined;
    }

    async getDefaultTargetDirectory(): Promise<string | undefined> {
        const packages = await this.packageManager.getAll();

        if (packages.some(p => p.name !== "core")) {
            const first = packages.filter(p => p.name !== "core").sort((p1, p2) => p1.name.localeCompare(p2.name))[0];
            return `/${first.name}/code`;
        }
    }

    async createFile(location: string, name: string, content: string, openAfter = true): Promise<void> {
        if (location.endsWith("/")) location = location.substring(0, location.length - 1);
        let fullPath: string;

        if (codeDirRegExp.test(location) || codeDirResourceRegExp.test(location)) {
            const path = new Path(name);
            fullPath = `${location}/${path.name.split(/\./).join("/") + path.ext}`;
        } else fullPath = `${location}/${name}`;

        try {
            await this.fileSystem.saveContents(fullPath, content);
            if (openAfter) await this.openFile(fullPath);
        } catch (error) {
            throw new Error(messages.failed_create_file(fullPath, error.message));
        }
    }

    async openFile(path: string): Promise<void> {
        await open(this.opener, new URI(`martini:/${path}`));
    }

    async makeDir(location: string, name: string): Promise<void> {
        if (location.endsWith("/")) location = location.substring(0, location.length - 1);
        const _name = name.split(/\./).join("/");
        const fullPath = `${location}/${_name}`;
        try {
            await this.progressService.showProgress(messages.creating_directory(fullPath), async _ => {
                await this.fileSystem.makeDir(fullPath);
            });
        } catch (error) {
            throw new Error(messages.failed_create_directory(fullPath));
        }
    }

    private hasUri(widget: any): widget is UriProvider {
        return "uri" in widget;
    }
}

interface UriProvider {
    uri: URI;
}
