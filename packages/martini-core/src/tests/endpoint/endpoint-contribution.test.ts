import {makeContainerForCommandTest} from "../containers";
import {CommandRegistry, SelectionService} from "@theia/core";
import {DeleteCommand} from "../../browser/martini-ide-contribution";
import {MartiniEndpoint, MartiniEndpointManager} from "../../common/endpoint/martini-endpoint-manager";
import {MartiniEndpointManagerNode} from "../../node/endpoint/node-martini-endpoint-manager";
import {
    EndpointCommandContribution,
    StartEndpointCommand,
    StopEndpointCommand
} from "../../browser/endpoint/endpoint-contribution";

jest.mock("../../node/endpoint/node-martini-endpoint-manager");

const container = makeContainerForCommandTest([EndpointCommandContribution], _container => {
    _container.bind(MartiniEndpointManager).toConstantValue(new MartiniEndpointManagerNode());
});

const selectionService = container.get(SelectionService);
const commands = container.get(CommandRegistry);
const manager: MartiniEndpointManager = container.get(MartiniEndpointManager);

beforeEach(() => jest.clearAllMocks());

test("Start command should be enabled when a stopped endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(StartEndpointCommand.id)).toBe(true);
});

test("Start command should be disabled when a started endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(StartEndpointCommand.id)).toBe(false);
});

test("Start command should start the selected stopped endpoints", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(StartEndpointCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(2);
    expect(manager.start).toHaveBeenCalledWith("test", "test1");
    expect(manager.start).toHaveBeenCalledWith("test", "test2");
});

test("Start command should start only stopped endpoints when multiple are selected", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(StartEndpointCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(1);
    expect(manager.start).toHaveBeenCalledWith("test", "test1");
    expect(manager.start).not.toHaveBeenCalledWith("test", "test2");
});

test("Stop command should be enabled when a started endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(StopEndpointCommand.id)).toBe(true);
});

test("Stop command should be disabled when a stopped endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(StopEndpointCommand.id)).toBe(false);
});

test("Stop command should stop the selected started endpoints", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(StopEndpointCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(2);
    expect(manager.stop).toHaveBeenCalledWith("test", "test1");
    expect(manager.stop).toHaveBeenCalledWith("test", "test2");
});

test("Stop command should stop only started endpoints when multiple are selected", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(StopEndpointCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(1);
    expect(manager.stop).toHaveBeenCalledWith("test", "test1");
    expect(manager.stop).not.toHaveBeenCalledWith("test", "test2");
});

test("Delete command should be enabled when a started endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be enabled when a stopped endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STOPPED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be disabled when a core endpoint is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "core",
            service: ""
        } as MartiniEndpoint
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should delete the selected started endpoint", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(2);
    expect(manager.delete).toHaveBeenCalledWith("test", "test1");
    expect(manager.delete).toHaveBeenCalledWith("test", "test2");
});

test("Delete command should not delete selected core endpoints", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "test",
            service: ""
        },
        {
            name: "test2",
            type: "dir-watcher",
            status: "STARTED",
            enabled: true,
            modifiable: true,
            packageName: "core",
            service: ""
        }
    ] as MartiniEndpoint[];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(1);
    expect(manager.delete).toHaveBeenCalledWith("test", "test1");
    expect(manager.delete).not.toHaveBeenCalledWith("core", "test2");
});
