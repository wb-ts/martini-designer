require("reflect-metadata");
import { MessageClient } from "@theia/core";
import { MessageService } from "@theia/core/lib/common/message-service";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { Container } from "inversify";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { EndpointEditor, EndpointEditorOptions } from "../../../browser/endpoint/editor/endpoint-editor";
import { EndpointEventDispatcher, EndpointEventDispatcherClient } from "../../../browser/endpoint/endpoint-event-dispatcher";
import { ProgressService } from "../../../browser/progress/progress-service";
import { createDefaultEndpoint } from "../../../common/endpoint/martini-endpoint-defaults";
import { EndpointType, MartiniEndpointManager } from "../../../common/endpoint/martini-endpoint-manager";
import { MartiniEndpointManagerNode } from "../../../node/endpoint/node-martini-endpoint-manager";
import { DocumentTypeManager } from "../../../common/tracker/document-type-manager";
import { DocumentTypeManagerNode } from "../../../node/tracker/node-document-type-manager";

jest.mock("../../../node/endpoint/node-martini-endpoint-manager");
jest.mock("../../../node/tracker/node-document-type-manager");
jest.mock("@theia/core/src/common/message-service");

Enzyme.configure({ adapter: new Adapter() });

const container = new Container();
container.bind(MartiniEndpointManager).toConstantValue(new MartiniEndpointManagerNode());
container.bind(DocumentTypeManager).toConstantValue(new DocumentTypeManagerNode());
container.bind(ProgressService).toConstantValue({
    showProgress: (_, task: any) =>
        task({
            isCancelled: () => false,
            report: noop
        })
} as ProgressService);
container.bind(MessageService).toConstantValue(new MessageService({} as MessageClient));
container.bind(EndpointEventDispatcher).to(EndpointEventDispatcherClient);
container.bind(EndpointEditor).toSelf().inRequestScope();
const options: EndpointEditorOptions = {
    uri: "endpoint://test",
    isNew: false,
    endpointType: EndpointType.DIR_WATCHER,
    name: "test",
    packageName: "test"
};
container.bind(EndpointEditorOptions).toConstantValue(options);
const manager = container.get<MartiniEndpointManager>(MartiniEndpointManager);

test("Editor should be rendered with new endpoint", async () => {
    options.isNew = true;
    const editor = container.get(EndpointEditor);
    const node = Renderer.create(editor.render() as React.ReactElement);
    const tree = node.toJSON();
    expect(tree).toMatchSnapshot();
    expect(editor.dirty).toBe(true);
});

test("Editor should be rendered with existing endpoint", async () => {
    options.isNew = false;
    const editor = container.get(EndpointEditor);
    manager.get = jest.fn(async name => createDefaultEndpoint("test", name, EndpointType.DIR_WATCHER));
    await Renderer.act(async () => await editor.init());
    expect(manager.get).toBeCalledWith("test", "test");
    const node = Renderer.create(editor.render() as React.ReactElement);
    const tree = node.toJSON();
    expect(tree).toMatchSnapshot();
    expect(editor.dirty).toBe(false);
});

test("Saving should make the editor not dirty", async () => {
    options.isNew = true;
    const editor = container.get(EndpointEditor);
    manager.save = jest.fn(_ => Promise.resolve());
    expect(editor.dirty).toBe(true);
    Object.assign(editor, {
        errors: []
    });
    await editor.save();
    expect(manager.save).toBeCalledTimes(1);
    expect(editor.dirty).toBe(false);
});

test("Should restart the endpoint after saving if started", async () => {
    const editor = container.get(EndpointEditor);
    manager.get = jest.fn(async name => {
        const endpoint = createDefaultEndpoint("test", name, EndpointType.DIR_WATCHER);
        endpoint.status = "STARTED";
        return endpoint;
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
