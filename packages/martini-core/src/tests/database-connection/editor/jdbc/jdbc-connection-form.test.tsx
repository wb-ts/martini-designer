require("reflect-metadata");
import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import { JdbcConnectionForm } from "../../../../browser/database-connection/editor/jdbc/jdbc-connection-form";
import { createDefaultConnection } from "../../../../browser/database-connection/editor/database-connection-editor";
import { DatabaseType, JdbcDatabaseConnection } from "../../../../common/database-connection/martini-database-connection-manager";
import { noop } from "lodash";

Enzyme.configure({ adapter: new Adapter() });

const connection = createDefaultConnection("test", DatabaseType.JDBC) as JdbcDatabaseConnection;
const driverProvider = async () => [];

test("JdbcConnectionForm should be rendered", () => {
    const component = Renderer.create(<JdbcConnectionForm
        connection={connection}
        driverProvider={driverProvider}
        onChange={noop}
        onValidate={noop}
        reset={false}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
