require("reflect-metadata");
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { CassandraConnectionForm } from "../../../../browser/database-connection/editor/cassandra/cassandra-connection-form";
import { createDefaultConnection } from "../../../../browser/database-connection/editor/database-connection-editor";
import { CassandraDatabaseConnection, DatabaseType } from "../../../../common/database-connection/martini-database-connection-manager";

Enzyme.configure({ adapter: new Adapter() });

const connection = createDefaultConnection("test", DatabaseType.CASSANDRA) as CassandraDatabaseConnection;
connection.contactPoints = ["point1", "point2", "point3"];

test("CassandraConnectionForm should be rendered", () => {
    const component = Renderer.create(<CassandraConnectionForm
        connection={connection}
        onChange={noop}
        onValidate={noop}
        reset={false}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
