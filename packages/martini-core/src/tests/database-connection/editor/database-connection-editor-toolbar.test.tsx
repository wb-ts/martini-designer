import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import { DatabaseConnectionEditorToolbar } from "../../../browser/database-connection/editor/database-connection-editor-toolbar";
import { DatabaseType } from "../../../common/database-connection/martini-database-connection-manager";
import { noop } from "lodash";

Enzyme.configure({ adapter: new Adapter() });

test("DatabaseConnectionEditorToolbar should be rendered", () => {
    const component = Renderer.create(<DatabaseConnectionEditorToolbar
        connectionName="test"
        onStart={noop}
        onStop={noop}
        databaseType={DatabaseType.JDBC}
        errors={[]}
        status="STARTED"
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("DatabaseConnectionEditorToolbar should be rendered with start and stop disabled", () => {
    const component = Renderer.create(<DatabaseConnectionEditorToolbar
        connectionName="test"
        databaseType={DatabaseType.JDBC}
        errors={[]}
        status="STARTED"
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("DatabaseConnectionEditorToolbar should be rendered with errors", () => {
    const component = Renderer.create(<DatabaseConnectionEditorToolbar
        connectionName="test"
        onStart={noop}
        onStop={noop}
        databaseType={DatabaseType.JDBC}
        errors={[{ label: "URL", message: "Cannot be blank." }]}
        status="STARTED"
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
