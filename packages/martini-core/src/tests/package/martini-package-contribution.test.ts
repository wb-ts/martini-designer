require("reflect-metadata");
import { CommandRegistry, SelectionService } from "@theia/core";
import { DeleteCommand } from "../../browser/martini-ide-contribution";
import {
    LoadPackageCommand,
    MartiniPackageCommandContribution,
    RestartPackageCommand,
    StartPackageCommand,
    StopPackageCommand,
    UnloadPackageCommand
} from "../../browser/package/martini-package-contribution";
import { MartiniPackage, MartiniPackageManager } from "../../common/package/martini-package-manager";
import { MartiniPackageManagerNode } from "../../node/package/node-martini-package-manager";
import { makeContainerForCommandTest } from "../containers";

jest.mock("../../node/package/node-martini-package-manager");

const container = makeContainerForCommandTest([MartiniPackageCommandContribution], _container => {
    _container.bind(MartiniPackageManager).toConstantValue(new MartiniPackageManagerNode());
});

const selectionService = container.get(SelectionService);
const commands = container.get(CommandRegistry);
const manager: MartiniPackageManager = container.get(MartiniPackageManager);
const defaultPackage = {
    id: "test",
    name: "test",
    contextPath: "/test",
    status: "STARTED",
    version: "1.0.0",
    stateOnStartup: "STARTED",
    dependsOn: [],
    jmsDestinations: [],
    shutdownServices: [],
    startupServices: []
} as MartiniPackage;

beforeEach(() => jest.clearAllMocks());

test("Start command should be enabled when a loaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(StartPackageCommand.id)).toBe(true);
});

test("Start command should be enabled when an unloaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "UNLOADED" }];
    expect(commands.isEnabled(StartPackageCommand.id)).toBe(true);
});

test("Start command should be disabled when a started package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "STARTED" }];
    expect(commands.isEnabled(StartPackageCommand.id)).toBe(false);
});

test("Start command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(StartPackageCommand.id)).toBe(false);
});

test("Start command should start the selected loaded and unloaded packages", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "LOADED" },
        { ...defaultPackage, name: "test2", status: "UNLOADED" }
    ];

    await commands.executeCommand(StartPackageCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(2);
    expect(manager.start).toHaveBeenCalledWith("test1");
    expect(manager.start).toHaveBeenCalledWith("test2");
});

test("Start command should start only loaded and unloaded packages when multiple are selected", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "LOADED" },
        { ...defaultPackage, name: "test2", status: "UNLOADED" },
        { ...defaultPackage, name: "test3", status: "STARTED" }
    ];

    await commands.executeCommand(StartPackageCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(2);
    expect(manager.start).toHaveBeenCalledWith("test1");
    expect(manager.start).toHaveBeenCalledWith("test2");
    expect(manager.start).not.toHaveBeenCalledWith("test3");
});

test("Stop command should be enabled when a started package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "STARTED" }];
    expect(commands.isEnabled(StopPackageCommand.id)).toBe(true);
});

test("Stop command should be disabled when a loaded packaged is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(StopPackageCommand.id)).toBe(false);
});

test("Stop command should be disabled when an unloaded packaged is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "UNLOADED" }];
    expect(commands.isEnabled(StopPackageCommand.id)).toBe(false);
});

test("Stop command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(StopPackageCommand.id)).toBe(false);
});

test("Stop command should stop the selected started packages", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "STARTED" },
        { ...defaultPackage, name: "test2", status: "STARTED" }
    ];

    await commands.executeCommand(StopPackageCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(2);
    expect(manager.stop).toHaveBeenCalledWith("test1");
    expect(manager.stop).toHaveBeenCalledWith("test2");
});

test("Stop command should stop only started packages when multiple are selected", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "STARTED" },
        { ...defaultPackage, name: "test2", status: "LOADED" }
    ];

    await commands.executeCommand(StopPackageCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(1);
    expect(manager.stop).toHaveBeenCalledWith("test1");
    expect(manager.stop).not.toHaveBeenCalledWith("test2");
});

test("Load command should be enabled when a unloaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "UNLOADED" }];
    expect(commands.isEnabled(LoadPackageCommand.id)).toBe(true);
});

test("Load command should be disabled when a loaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(LoadPackageCommand.id)).toBe(false);
});

test("Load command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(LoadPackageCommand.id)).toBe(false);
});

test("Load command should load the selected unloaded packages", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "UNLOADED" },
        { ...defaultPackage, name: "test2", status: "UNLOADED" }
    ];

    await commands.executeCommand(LoadPackageCommand.id);

    expect(manager.load).toHaveBeenCalledTimes(2);
    expect(manager.load).toHaveBeenCalledWith("test1");
    expect(manager.load).toHaveBeenCalledWith("test2");
});

test("Load command should load only unloaded packages when multiple are selected", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "UNLOADED" },
        { ...defaultPackage, name: "test2", status: "STARTED" }
    ];

    await commands.executeCommand(LoadPackageCommand.id);

    expect(manager.load).toHaveBeenCalledTimes(1);
    expect(manager.load).toHaveBeenCalledWith("test1");
    expect(manager.load).not.toHaveBeenCalledWith("test2");
});

test("Unload command should be enabled when a started package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "STARTED" }];
    expect(commands.isEnabled(UnloadPackageCommand.id)).toBe(true);
});

test("Unload command should be enabled when a loaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(UnloadPackageCommand.id)).toBe(true);
});

test("Unload command should be disabled when an unloaded package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "UNLOADED" }];
    expect(commands.isEnabled(UnloadPackageCommand.id)).toBe(false);
});

test("Unload command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(UnloadPackageCommand.id)).toBe(false);
});

test("Unload command should load the selected loaded and started packages", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "LOADED" },
        { ...defaultPackage, name: "test2", status: "STARTED" }
    ];

    await commands.executeCommand(UnloadPackageCommand.id);

    expect(manager.unload).toHaveBeenCalledTimes(2);
    expect(manager.unload).toHaveBeenCalledWith("test1");
    expect(manager.unload).toHaveBeenCalledWith("test2");
});

test("Unload command should unload only unloaded and started packages when multiple are selected", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "LOADED" },
        { ...defaultPackage, name: "test2", status: "STARTED" },
        { ...defaultPackage, name: "test3", status: "UNLOADED" }
    ];

    await commands.executeCommand(UnloadPackageCommand.id);

    expect(manager.unload).toHaveBeenCalledTimes(2);
    expect(manager.unload).toHaveBeenCalledWith("test1");
    expect(manager.unload).toHaveBeenCalledWith("test2");
    expect(manager.unload).not.toHaveBeenCalledWith("test3");
});

test("Restart command should be enabled when a started package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "STARTED" }];
    expect(commands.isEnabled(RestartPackageCommand.id)).toBe(true);
});

test("Restart command should be disabled when a loaded packaged is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(RestartPackageCommand.id)).toBe(false);
});

test("Restart command should be disabled when an unloaded packaged is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "UNLOADED" }];
    expect(commands.isEnabled(RestartPackageCommand.id)).toBe(false);
});

test("Restart command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(RestartPackageCommand.id)).toBe(false);
});

test("Restart command should restart the selected started packages", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "STARTED" },
        { ...defaultPackage, name: "test2", status: "STARTED" }
    ];

    await commands.executeCommand(RestartPackageCommand.id);

    expect(manager.restart).toHaveBeenCalledTimes(2);
    expect(manager.restart).toHaveBeenCalledWith("test1");
    expect(manager.restart).toHaveBeenCalledWith("test2");
});

test("Restart command should restart only started packages when multiple are selected", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "STARTED" },
        { ...defaultPackage, name: "test2", status: "LOADED" }
    ];

    await commands.executeCommand(RestartPackageCommand.id);

    expect(manager.restart).toHaveBeenCalledTimes(1);
    expect(manager.restart).toHaveBeenCalledWith("test1");
    expect(manager.restart).not.toHaveBeenCalledWith("test2");
});

test("Delete command should be enabled when a started package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "STARTED" }];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be enabled when a stopped package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, status: "LOADED" }];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be disabled when the core package is selected", () => {
    selectionService.selection = [{ ...defaultPackage, name: "core" }];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should delete the selected started package", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test1", status: "STARTED" },
        { ...defaultPackage, name: "test2", status: "STARTED" }
    ];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(2);
    expect(manager.delete).toHaveBeenCalledWith("test1");
    expect(manager.delete).toHaveBeenCalledWith("test2");
});

test("Delete command should not delete selected core package", async () => {
    selectionService.selection = [
        { ...defaultPackage, name: "test", status: "STARTED" },
        { ...defaultPackage, name: "core" }
    ];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(1);
    expect(manager.delete).toHaveBeenCalledWith("test");
    expect(manager.delete).not.toHaveBeenCalledWith("core");
});
