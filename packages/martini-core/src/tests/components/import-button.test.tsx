// tslint:disable-next-line:no-var-requires
require("reflect-metadata"); // has to stay at the top
import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import {ImportButton} from "../../browser/components/import-button";
import * as Renderer from "react-test-renderer";

Enzyme.configure({adapter: new Adapter()});

test("ImportButton should be rendered", () => {
    const component = Renderer.create(<ImportButton/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Changing a input file should call onFileImport", () => {
    let actual: File | undefined;
    const importButton = Enzyme.mount(<ImportButton onFileImport={value => actual = value as File}/>);
    const expected = "test.json";
    const file = new File([], expected);
    const fileList = {
        length: 1,
        item: (_: number) => file
    };
    importButton.find("input").first().simulate("change", {
        target: {
            files: fileList
        }
    });

    expect(actual).toBe(file);
});
