import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import "reflect-metadata";
import { CreateEndpointForm } from "../../../browser/endpoint/wizard/endpoint-wizard";
import { EndpointType } from "../../../common/endpoint/martini-endpoint-manager";

Enzyme.configure({ adapter: new Adapter() });

test("CreateEndpointForm should be rendered", () => {
    const component = Renderer.create(<CreateEndpointForm
        onValidate={noop}
        onChange={noop}
        existingNames={[]}
        packageNames={["test"]}
        defaultConfig={{
            type: EndpointType.DIR_WATCHER,
            packageName: "test",
            name: "test"
        }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
