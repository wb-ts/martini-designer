require("reflect-metadata");
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { RssEndpointForm } from "../../../../browser/endpoint/editor/rss/rss-endpoint-form";
import { createDefaultEndpoint } from "../../../../common/endpoint/martini-endpoint-defaults";
import { EndpointType, RssEndpoint } from "../../../../common/endpoint/martini-endpoint-manager";

Enzyme.configure({ adapter: new Adapter() });

const endpoint = createDefaultEndpoint("test", "test", EndpointType.RSS) as RssEndpoint;

test("RssEndpointForm should be rendered", () => {
    const component = Renderer.create(<RssEndpointForm
        endpoint={endpoint}
        documentTypeProvider={async () => []}
        onChange={noop}
        onValidate={noop}
        reset={false}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
