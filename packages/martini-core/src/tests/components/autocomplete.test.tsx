import * as React from "react";
import * as Renderer from "react-test-renderer";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { Autocomplete } from "../../browser/components/autocomplete";

Enzyme.configure({ adapter: new Adapter() });

test("Autocomplete should be rendered", () => {
    const component = Renderer.create(<Autocomplete
        value="test"
        suggestions={[]}
        onInputChange={() => { }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Autocomplete should be rendered with given input styles", () => {
    const component = Renderer.create(<Autocomplete
        value="test"
        suggestions={[]}
        onInputChange={() => { }}
        inputStyle={{
            color: "red"
        }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Changing input should filter and show suggestions", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: "a"
        }
    });

    expect(autocomplete.find("li").length).toBe(1);
    expect(autocomplete.find("li").hasClass("suggestion-active")).toBe(true);
});

test("Changing input to empty should show all suggestions", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });

    expect(autocomplete.find("li").length).toBe(3);
    expect(autocomplete.find("li").at(0).hasClass("suggestion-active")).toBe(true);
    expect(autocomplete.find("li").at(1).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(2).hasClass("suggestion-active")).toBe(false);
});

test("Pressing arrow down should move the active suggestion", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });
    autocomplete.find(".theia-input").simulate("keyup", {
        key: "ArrowDown"
    });

    expect(autocomplete.find("li").length).toBe(3);
    expect(autocomplete.find("li").at(0).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(1).hasClass("suggestion-active")).toBe(true);
    expect(autocomplete.find("li").at(2).hasClass("suggestion-active")).toBe(false);
});

test("Pressing arrow up should move the active suggestion", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });
    autocomplete.find(".theia-input").simulate("keyup", {
        key: "ArrowDown"
    });
    autocomplete.find(".theia-input").simulate("keyup", {
        key: "ArrowUp"
    });

    expect(autocomplete.find("li").length).toBe(3);
    expect(autocomplete.find("li").at(0).hasClass("suggestion-active")).toBe(true);
    expect(autocomplete.find("li").at(1).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(2).hasClass("suggestion-active")).toBe(false);
});

test("Pressing arrow down on the last suggestion should move the active suggestion to the first", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });
    Array(3).forEach(() => {
        autocomplete.find(".theia-input").simulate("keyup", {
            key: "ArrowDown"
        });
    });

    expect(autocomplete.find("li").length).toBe(3);
    expect(autocomplete.find("li").at(0).hasClass("suggestion-active")).toBe(true);
    expect(autocomplete.find("li").at(1).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(2).hasClass("suggestion-active")).toBe(false);
});

test("Pressing arrow up on the first suggestion should move the active suggestion to the last", () => {
    const autocomplete = Enzyme.mount(<Autocomplete
        value=""
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });
    autocomplete.find(".theia-input").simulate("keyup", {
        key: "ArrowUp"
    });

    expect(autocomplete.find("li").length).toBe(3);
    expect(autocomplete.find("li").at(0).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(1).hasClass("suggestion-active")).toBe(false);
    expect(autocomplete.find("li").at(2).hasClass("suggestion-active")).toBe(true);
});

test("Changing input should call onInputChange", () => {
    let value = "";
    const autocomplete = Enzyme.mount(<Autocomplete
        value={value}
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={text => value = text}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: "test"
        }
    });

    expect(value).toBe("test");
});

test("Selecting a suggestion should apply it and call onSuggestionSelect", () => {
    let value = "";
    const autocomplete = Enzyme.mount(<Autocomplete
        value={value}
        suggestions={[
            "abc",
            "def",
            "ghi"
        ].map(label => ({ label }))}
        onInputChange={() => { }}
        onSuggestionSelect={input => value = input}
    />);

    autocomplete.find(".theia-input").simulate("change", {
        target: {
            value: ""
        }
    });
    autocomplete.find("li").at(0).simulate("click", {});
    expect(value).toBe("abc");
});
