import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import "reflect-metadata";
import { CreateDatabaseConnectionForm } from "../../../browser/database-connection/wizard/database-connection-wizard";
import { DatabaseType } from "../../../common/database-connection/martini-database-connection-manager";

Enzyme.configure({ adapter: new Adapter() });

test("CreateDatabaseConnectionForm should be rendered", () => {
    const component = Renderer.create(<CreateDatabaseConnectionForm
        onChange={noop}
        onValidate={noop}
        existingNames={[]}
        defaultConfig={{
            type: DatabaseType.CASSANDRA,
            name: "test"
        }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
