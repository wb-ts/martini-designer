import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import {RadioButton} from "../../browser/components/radio-button";

Enzyme.configure({adapter: new Adapter()});

test("RadioButton should be rendered unchecked with label", () => {
    const component = Renderer.create(<RadioButton label="Test" checked={false}/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("RadioButton should be rendered checked with label", () => {
    const component = Renderer.create(<RadioButton label="Test" checked={true}/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("RadioButton should be rendered without label", () => {
    const component = Renderer.create(<RadioButton/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Checking the radio button should call onChange with the value", () => {
    const expected = "test";
    let actual = "";
    const importButton = Enzyme.mount(<RadioButton value={expected} onChange={value => actual = value}/>);
    importButton.find("input").first().simulate("change");

    expect(actual).toBe(expected);
});
