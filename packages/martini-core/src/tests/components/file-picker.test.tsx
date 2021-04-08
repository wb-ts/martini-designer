import * as React from "react";
import * as Renderer from "react-test-renderer";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import {FilePicker} from "../../browser/components/file-picker";

Enzyme.configure({adapter: new Adapter()});

test("FilePicker should be rendered", () => {
    const component = Renderer.create(<FilePicker placeholder="Test" extensions=".json,.xml,.yaml"/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Changing input text should call onChange", () => {
    let actual = "";
    const filePicker = Enzyme.mount(<FilePicker onChange={value => actual = value as string}/>);
    const expected = "test.json";
    filePicker.find(".theia-input").simulate("change", {
        target: {
            value: expected
        }
    });

    expect(actual).toBe(expected);
});

test("Dropping a file should call onChange", () => {
    let actual: File | undefined;
    const filePicker = Enzyme.mount(<FilePicker onChange={value => actual = value as File}/>);
    const expected = "test.json";
    const file = new File([], expected);
    const fileList = {
        length: 1,
        item: (_: number) => file
    };
    filePicker.find(".theia-input").simulate("drop", {
        dataTransfer: {
            files: fileList
        }
    });

    expect(filePicker.find(".theia-input").props().value).toBe(expected);
    expect(actual).toBe(file);
});

test("Dropping a file should call onChange if the extension type is valid", () => {
    let actual: File | undefined;
    const filePicker = Enzyme.mount(
        <FilePicker
            onChange={value => actual = value as File}
            extensions=".json"
        />
    );
    const expected = "test.json";
    const file = new File([], expected);
    const fileList = {
        length: 1,
        item: (_: number) => file
    };
    filePicker.find(".theia-input").simulate("drop", {
        dataTransfer: {
            files: fileList
        }
    });

    expect(filePicker.find(".theia-input").props().value).toBe(expected);
    expect(actual).toBe(file);
});

test("Dropping a file should not call onChange if the extension type is invalid", () => {
    let actual: File | undefined;
    const filePicker = Enzyme.mount(
        <FilePicker
            onChange={value => actual = value as File}
            extensions=".json"
        />
    );
    const expected = "test.xml";
    const file = new File([], expected);
    const fileList = {
        length: 1,
        item: (_: number) => file
    };
    filePicker.find(".theia-input").simulate("drop", {
        dataTransfer: {
            files: fileList
        }
    });

    expect(filePicker.find(".theia-input").props().value).toBe("");
    expect(actual).toBeUndefined();
});

test("Changing a input file should call onChange", () => {
    let actual: File | undefined;
    const filePicker = Enzyme.mount(<FilePicker onChange={value => actual = value as File}/>);
    const expected = "test.json";
    const file = new File([], expected);
    const fileList = {
        length: 1,
        item: (_: number) => file
    };
    filePicker.find("input").first().simulate("change", {
        target: {
            files: fileList
        }
    });

    expect(filePicker.find(".theia-input").props().value).toBe(expected);
    expect(actual).toBe(file);
});
