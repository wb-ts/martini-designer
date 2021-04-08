// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
import { SelectionService } from "@theia/core";
import { ApplicationShell, OpenerService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common/message-service";
import URI from "@theia/core/lib/common/uri";
import { Container, decorate, injectable } from "inversify";
import { FileWizardHelper } from "../../../browser/fs/wizard/file-wizard-helper";
import { ProgressService } from "../../../browser/progress/progress-service";
import { MartiniFileSystem, Resource } from "../../../common/fs/martini-filesystem";
import { MartiniPackageManager } from "../../../common/package/martini-package-manager";
import { MartiniFileSystemNode } from "../../../node/fs/node-martini-filesystem";
import { MartiniPackageManagerNode } from "../../../node/package/node-martini-package-manager";

jest.mock("../../../node/fs/node-martini-filesystem");
jest.mock("@theia/core/lib/browser");
jest.mock("@theia/core/lib/common/message-service");
jest.mock("../../../browser/progress/progress-service");
jest.mock("../../../node/package/node-martini-package-manager");

const container = new Container();
container.bind(MartiniFileSystem).toConstantValue(new MartiniFileSystemNode());
decorate(injectable(), ApplicationShell);
container
    .bind(ApplicationShell)
    .toSelf()
    .inSingletonScope();
container
    .bind(SelectionService)
    .toSelf()
    .inSingletonScope();
container.bind(OpenerService).toConstantValue({});
container.bind(ProgressService).toConstantValue({
    showProgress: (_, task: any) =>
        task({
            isCancelled: () => false,
            report: (_: any) => {}
        })
} as ProgressService);
decorate(injectable(), MessageService);
container
    .bind(MessageService)
    .toSelf()
    .inSingletonScope();
container.bind(MartiniPackageManager).toConstantValue(new MartiniPackageManagerNode());
container.bind(FileWizardHelper).toSelf();

const selectionService = container.get(SelectionService);
const helper = container.get(FileWizardHelper);
const shell = container.get(ApplicationShell);
const packageManager = container.get<MartiniPackageManager>(MartiniPackageManager);
const filesystem = container.get<MartiniFileSystem>(MartiniFileSystem);

test("Target directory path should be the selected directory", () => {
    selectionService.selection = [
        {
            name: "test",
            location: "/test/code/test",
            directory: true,
            lastModified: 0,
            size: 0,
            readOnly: true
        } as Resource
    ];
    const result = helper.getTargetDirectoryPath();
    expect(result).toBe("/test/code/test");
});

test("Target directory path should be the parent directory of selected file", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            directory: false,
            lastModified: 0,
            size: 0,
            readOnly: true
        } as Resource
    ];
    const result = helper.getTargetDirectoryPath();
    expect(result).toBe("/test/code");
});

test("Target directory path should be undefined", () => {
    selectionService.selection = [];
    const result = helper.getTargetDirectoryPath();
    expect(result).toBeUndefined();
});

test("Target directory path should be the current widget's URI parent directory", () => {
    // @ts-ignore
    shell.currentWidget = { uri: new URI("martini:/test/code/test.gloop") };
    const result = helper.getTargetDirectoryPath();
    expect(result).toBe("/test/code");
});

test("Target directory path should be the current widget's URI parent directory even when resource selected", () => {
    selectionService.selection = [
        {
            name: "test",
            location: "/test/code/test",
            directory: true,
            lastModified: 0,
            size: 0,
            readOnly: true
        } as Resource
    ];
    // @ts-ignore
    shell.currentWidget = { uri: new URI("martini:/test/code/test.gloop") };
    const result = helper.getTargetDirectoryPath();
    expect(result).toBe("/test/code");
});

test("Default target directory should be the alphabetically first package's code directory", async () => {
    // @ts-ignore
    packageManager.getAll.mockReturnValue(Promise.resolve([{ name: "core" }, { name: "b" }, { name: "a" }]));
    const result = await helper.getDefaultTargetDirectory();
    expect(result).toBe("/a/code");
});

test("Default target directory should be undefined when there is only core package", async () => {
    // @ts-ignore
    packageManager.getAll.mockReturnValue(Promise.resolve([{ name: "core" }]));
    const result = await helper.getDefaultTargetDirectory();
    expect(result).toBeUndefined();
});

test("File name with dots with location as code directory should be transformed to directories", async () => {
    await helper.createFile("/test/code", "test.test.gloop", "{}");
    expect(filesystem.saveContents).toBeCalledWith("/test/code/test/test.gloop", "{}");
});

test("Location with trailing / should work", async () => {
    await helper.createFile("/test/code/", "test.test.gloop", "{}");
    expect(filesystem.saveContents).toBeCalledWith("/test/code/test/test.gloop", "{}");
});

test("File name with dots with location as not code directory should be transformed to directories", async () => {
    await helper.createFile("/test/resources", "test.test.txt", "");
    expect(filesystem.saveContents).toBeCalledWith("/test/resources/test.test.txt", "");
});
