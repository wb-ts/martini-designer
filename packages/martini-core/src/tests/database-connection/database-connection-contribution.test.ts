import {makeContainerForCommandTest} from "../containers";
import {
    DatabaseConnection,
    MartiniDatabaseConnectionManager
} from "../../common/database-connection/martini-database-connection-manager";
import {CommandRegistry, SelectionService} from "@theia/core";
import {
    DatabaseConnectionCommandContribution,
    StartDatabaseConnectionCommand,
    StopDatabaseConnectionCommand
} from "../../browser/database-connection/database-connection-contribution";
import {DeleteCommand} from "../../browser/martini-ide-contribution";
import {MartiniDatabaseConnectionManagerNode} from "../../node/database-connection/node-database-connection-manager";

jest.mock("../../node/database-connection/node-database-connection-manager");

const container = makeContainerForCommandTest([DatabaseConnectionCommandContribution], _container => {
    _container.bind(MartiniDatabaseConnectionManager).toConstantValue(new MartiniDatabaseConnectionManagerNode());
});

const selectionService = container.get(SelectionService);
const commands = container.get(CommandRegistry);
const manager: MartiniDatabaseConnectionManager = container.get(MartiniDatabaseConnectionManager);

beforeEach(() => jest.clearAllMocks());

test("Start command should be enabled when a stopped database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(StartDatabaseConnectionCommand.id)).toBe(true);
});

test("Start command should be disabled when a started database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(StartDatabaseConnectionCommand.id)).toBe(false);
});

test("Start command should start the selected stopped database connections", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        },
        {
            name: "test2",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(StartDatabaseConnectionCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(2);
    expect(manager.start).toHaveBeenCalledWith("test1");
    expect(manager.start).toHaveBeenCalledWith("test2");
});

test("Start command should start only stopped database connections when multiple are selected", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        },
        {
            name: "test2",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(StartDatabaseConnectionCommand.id);

    expect(manager.start).toHaveBeenCalledTimes(1);
    expect(manager.start).toHaveBeenCalledWith("test1");
    expect(manager.start).not.toHaveBeenCalledWith("test2");
});

test("Stop command should be enabled when a started database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(StopDatabaseConnectionCommand.id)).toBe(true);
});

test("Stop command should be disabled when a stopped database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(StopDatabaseConnectionCommand.id)).toBe(false);
});

test("Stop command should stop the selected started database connections", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        },
        {
            name: "test2",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(StopDatabaseConnectionCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(2);
    expect(manager.stop).toHaveBeenCalledWith("test1");
    expect(manager.stop).toHaveBeenCalledWith("test2");
});

test("Stop command should stop only started database connections when multiple are selected", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        },
        {
            name: "test2",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(StopDatabaseConnectionCommand.id);

    expect(manager.stop).toHaveBeenCalledTimes(1);
    expect(manager.stop).toHaveBeenCalledWith("test1");
    expect(manager.stop).not.toHaveBeenCalledWith("test2");
});

test("Delete command should be enabled when a started database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be enabled when a stopped database connection is selected", () => {
    selectionService.selection = [
        {
            name: "test",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(true);
});

test("Delete command should be disabled when a core database connection is selected", () => {
    selectionService.selection = [
        {
            name: "tracker",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        } as DatabaseConnection
    ];
    expect(commands.isEnabled(DeleteCommand.id)).toBe(false);
});

test("Delete command should delete the selected started database connections", async () => {
    selectionService.selection = [
        {
            name: "test1",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        },
        {
            name: "test2",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(2);
    expect(manager.delete).toHaveBeenCalledWith("test1");
    expect(manager.delete).toHaveBeenCalledWith("test2");
});

test("Delete command should not delete selected core database connections", async () => {
    selectionService.selection = [
        {
            name: "tracker",
            type: "jdbc",
            status: "STARTED",
            autoStart: true
        },
        {
            name: "test",
            type: "jdbc",
            status: "STOPPED",
            autoStart: true
        }
    ] as DatabaseConnection[];

    await commands.executeCommand(DeleteCommand.id);

    expect(manager.delete).toHaveBeenCalledTimes(1);
    expect(manager.delete).toHaveBeenCalledWith("test");
    expect(manager.delete).not.toHaveBeenCalledWith("tracker");
});
