import {makeContainerForCommandTest} from "../containers";
import {MartiniFileSystemCommandContribution} from "../../browser/fs/martini-filesystem-contribution";
import {MartiniFileSystem, Resource} from "../../common/fs/martini-filesystem";
import {MartiniFileSystemNode} from "../../node/fs/node-martini-filesystem";
import {CommandRegistry, SelectionService} from "@theia/core";
import {DeleteCommand, RenameCommand} from "../../browser/martini-ide-contribution";
import {DefaultResourceNameValidator} from "../../browser/fs/resource-name-validator";
import {SingleTextInputDialog} from "@theia/core/lib/browser";

jest.mock("../../node/fs/node-martini-filesystem");

const container = makeContainerForCommandTest([MartiniFileSystemCommandContribution], _container => {
    _container.bind(MartiniFileSystem).toConstantValue(new MartiniFileSystemNode());
    _container.bind(DefaultResourceNameValidator).toSelf().inSingletonScope();
});

const fileSystem: MartiniFileSystem = container.get(MartiniFileSystem);
const commands = container.get(CommandRegistry);
const selectionService = container.get(SelectionService);
let newName = "";
SingleTextInputDialog.prototype.open = async () => newName;

test("Delete command should be enabled for selected resource", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should disabled for selected readonly resource", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: true,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should disabled for selected code directory", () => {
    selectionService.selection = [
        {
            name: "code",
            location: "/test/code",
            readOnly: false,
            directory: true,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should disabled for selected core resources", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/core/code/test.gloop",
            readOnly: false,
            directory: true,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should disabled for selected core resources", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/core/code/test.gloop",
            readOnly: false,
            directory: true,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should delete the selected resources", async () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    await commands.executeCommand(DeleteCommand.id);

    expect(fileSystem.delete).toBeCalledTimes(1);
    expect(fileSystem.delete).toBeCalledWith("/test/code/test.gloop");
});

test("Rename command should be enabled for selected resources", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(RenameCommand.id)).toBe(true);
});

test("Rename command should be disabled for multiple selected resources", () => {
    selectionService.selection = [
        {
            name: "test1.gloop",
            location: "/test/code/test1.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        },
        {
            name: "test2.gloop",
            location: "/test/code/test2.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        }
    ] as Resource [];
    expect(commands.isEnabled(RenameCommand.id)).toBe(false);
});

test("Rename command should be disabled for selected readonly resource", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: true,
            directory: false,
            size: 0,
            lastModified: 0
        }
    ];
    expect(commands.isEnabled(RenameCommand.id)).toBe(false);
});

test("Rename command should be disabled for selected core resource", () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/core/code/test.gloop",
            readOnly: true,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    expect(commands.isEnabled(RenameCommand.id)).toBe(false);
});

test("Rename command should rename the selected resource", async () => {
    selectionService.selection = [
        {
            name: "test.gloop",
            location: "/test/code/test.gloop",
            readOnly: false,
            directory: false,
            size: 0,
            lastModified: 0
        } as Resource
    ];
    newName = "blah.gloop";
    await commands.executeCommand(RenameCommand.id);

    expect(fileSystem.rename).toBeCalledTimes(1);
    expect(fileSystem.rename).toBeCalledWith("/test/code/test.gloop", "blah.gloop");
});
