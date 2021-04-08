require("reflect-metadata");
import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import createDefaultRedisDatabaseConnection from "../../../../browser/database-connection/editor/redis/redis-connection-default";
import { RedisConnectionForm } from "../../../../browser/database-connection/editor/redis/redis-connection-form";
import { noop } from "lodash";

Enzyme.configure({ adapter: new Adapter() });

const connection = createDefaultRedisDatabaseConnection("test");

test("RedisConnectionForm should be rendered", () => {
    const component = Renderer.create(
        <RedisConnectionForm connection={connection} onChange={noop} onValidate={noop} reset={false} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
