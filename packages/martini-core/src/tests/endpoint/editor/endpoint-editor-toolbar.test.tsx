import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { EndpointEditorToolbar } from "../../../browser/endpoint/editor/endpoint-editor-toolbar";
import { EndpointType } from "../../../common/endpoint/martini-endpoint-manager";
import { noop } from "lodash";

Enzyme.configure({ adapter: new Adapter() });

test("EndpointEditorToolbar should be rendered", () => {
    const component = Renderer.create(<EndpointEditorToolbar
        endpointName="test"
        endpointType={EndpointType.DIR_WATCHER}
        errors={[]}
        status="STARTED"
        onStart={noop}
        onStop={noop}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("EndpointEditorToolbar should be rendered with disabled start and stop", () => {
    const component = Renderer.create(<EndpointEditorToolbar
        endpointName="test"
        endpointType={EndpointType.DIR_WATCHER}
        errors={[]}
        status="STARTED"
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("EndpointEditorToolbar should be rendered with errors", () => {
    const component = Renderer.create(<EndpointEditorToolbar
        endpointName="test"
        endpointType={EndpointType.DIR_WATCHER}
        errors={[{ label: "URL", message: "Cannot be blank." }]}
        status="STARTED"
        onStart={noop}
        onStop={noop}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
