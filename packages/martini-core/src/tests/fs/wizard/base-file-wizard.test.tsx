import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom/test-utils";
import * as Renderer from "react-test-renderer";
import "reflect-metadata";
import { CreateFileForm } from "../../../browser/fs/wizard/base-file-wizard";

Enzyme.configure({ adapter: new Adapter() });

test("CreateFileForm should be rendered", () => {
    const component = Renderer.create(<CreateFileForm
        initialLocation="/examples/code"
        initialName="MyFile"
        fileExt="txt"
        onValidate={noop}
        onChange={noop}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Browsing location should set the input value", async () => {
    const handleBrowse = jest.fn(async () => "/examples/code/test");
    const form = Enzyme.mount(<CreateFileForm
        initialLocation="/examples/code"
        initialName="MyFile"
        fileExt="txt"
        onValidate={noop}
        onChange={noop}
        onBrowseLocation={handleBrowse}
    />);
    await ReactDOM.act(async () => {
        form.find('input[value="Browse..."]').first().simulate("click");
        await new Promise(r => setTimeout(r, 200));
    });
    form.update();
    const input = form.find('input[name="location"]').first();
    expect(handleBrowse).toBeCalledWith("/examples/code");
    expect(handleBrowse).toBeCalledTimes(1);
    expect(input.prop("value")).toBe("/examples/code/test");
});
