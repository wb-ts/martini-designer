require("reflect-metadata");
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { EmailEndpointForm } from "../../../../browser/endpoint/editor/email/email-endpoint-form";
import { createDefaultEndpoint } from "../../../../common/endpoint/martini-endpoint-defaults";
import { EndpointType, EmailEndpoint } from "../../../../common/endpoint/martini-endpoint-manager";

Enzyme.configure({ adapter: new Adapter() });

const endpoint = createDefaultEndpoint("test", "test", EndpointType.EMAIL) as EmailEndpoint;

test("EmailEndpointForm should be rendered", () => {
    const component = Renderer.create(<EmailEndpointForm
        endpoint={endpoint}
        documentTypeProvider={async () => []}
        onChange={noop}
        onValidate={noop}
        reset={false}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
