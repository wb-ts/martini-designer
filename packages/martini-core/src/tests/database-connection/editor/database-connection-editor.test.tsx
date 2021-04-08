require("reflect-metadata");
import { MessageClient } from "@theia/core";
import { MessageService } from "@theia/core/lib/common/message-service";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { Container } from "inversify";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { DatabaseConnectionEventDispatcher, DatabaseConnectionEventDispatcherClient } from "../../../browser/database-connection/database-connection-event-dispatcher";
import { createDefaultConnection, DatabaseConnectionEditor, DatabaseConnectionEditorOptions } from "../../../browser/database-connection/editor/database-connection-editor";
import { ProgressService } from "../../../browser/progress/progress-service";
import { DatabaseType, MartiniDatabaseConnectionManager } from "../../../common/database-connection/martini-database-connection-manager";
import { MartiniDatabaseConnectionManagerNode } from "../../../node/database-connection/node-database-connection-manager";

jest.mock("../../../node/database-connection/node-database-connection-manager");
jest.mock("@theia/core/src/common/message-service");

Enzyme.configure({ adapter: new Adapter() });

const container = new Container();
container.bind(MartiniDatabaseConnectionManager).toConstantValue(new MartiniDatabaseConnectionManagerNode());
container.bind(ProgressService).toConstantValue({
    showProgress: (_, task: any) =>
        task({
            isCancelled: () => false,
            report: noop
        })
} as ProgressService);
container.bind(MessageService).toConstantValue(new MessageService({} as MessageClient));
container.bind(DatabaseConnectionEventDispatcher).to(DatabaseConnectionEventDispatcherClient);
container.bind(DatabaseConnectionEditor).toSelf().inRequestScope();
const options: DatabaseConnectionEditorOptions = {
    uri: "db-connection://test",
    isNew: false,
    databaseType: DatabaseType.JDBC,
    name: "test"
};
container.bind(DatabaseConnectionEditorOptions).toConstantValue(options);
const manager = container.get<MartiniDatabaseConnectionManager>(MartiniDatabaseConnectionManager);


test("Editor should be rendered with new connection", async () => {
    options.isNew = true;
    const editor = container.get(DatabaseConnectionEditor);
    const node = Renderer.create(editor.render() as React.ReactElement);
    const tree = node.toJSON();
    expect(tree).toMatchSnapshot();
    expect(editor.dirty).toBe(true);
});

test("Editor should be rendered with existing connection", async () => {
    options.isNew = false;
    const editor = container.get(DatabaseConnectionEditor);
    manager.get = jest.fn(async name => createDefaultConnection(name, DatabaseType.JDBC));
    await Renderer.act(async () => await editor.init());
    expect(manager.get).toBeCalledWith("test");
    const node = Renderer.create(editor.render() as React.ReactElement);
    const tree = node.toJSON();
    expect(tree).toMatchSnapshot();
    expect(editor.dirty).toBe(false);
});

test("Saving should make the editor not dirty", async () => {
    options.isNew = true;
    const editor = container.get(DatabaseConnectionEditor);
    manager.save = jest.fn(_ => Promise.resolve());
    expect(editor.dirty).toBe(true);
    Object.assign(editor, {
        errors: []
    });
    await editor.save();
    expect(manager.save).toBeCalledTimes(1);
    expect(editor.dirty).toBe(false);
});

test("Should restart the connection after saving if started", async () => {
    const editor = container.get(DatabaseConnectionEditor);
    manager.get = jest.fn(async name => {
        const connection = createDefaultConnection(name, DatabaseType.JDBC);
        connection.status = "STARTED";
        return connection;
    });

    await editor.init();
    Object.assign(editor, {
        errors: []
    });
    manager.save = jest.fn(_ => Promise.resolve());
    manager.start = jest.fn(_ => Promise.resolve());
    manager.stop = jest.fn(_ => Promise.resolve());
    Object.assign(editor, {
        errors: []
    });
    await editor.save();
    expect(manager.save).toBeCalledTimes(1);
    expect(manager.stop).toBeCalledTimes(1);
    expect(manager.start).toBeCalledTimes(1);
    expect(editor.dirty).toBe(false);
});
