require("reflect-metadata");
import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import { createDefaultConnection } from "../../../../browser/database-connection/editor/database-connection-editor";
import { DatabaseType, MongoDbDatabaseConnection } from "../../../../common/database-connection/martini-database-connection-manager";
import { noop } from "lodash";
import { MongoDbConnectionForm } from "../../../../browser/database-connection/editor/mongodb/mongodb-connection-form";

Enzyme.configure({ adapter: new Adapter() });

const connection = createDefaultConnection("test", DatabaseType.MONGODB) as MongoDbDatabaseConnection;
connection.clusterSettings.hosts = ["mongodb0.example.com:27017", "mongodb0.example.com:27018"];

test("MongoDbConnectionForm should be rendered", () => {
    const component = Renderer.create(<MongoDbConnectionForm
        connection={connection}
        onChange={noop}
        onValidate={noop}
        reset={false}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
