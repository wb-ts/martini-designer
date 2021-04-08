import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { Loader } from "../../browser/components/loader";

Enzyme.configure({ adapter: new Adapter() });

test("Loader should be rendered without message", () => {
    const component = Renderer.create(<Loader />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Loader should be rendered with a message", () => {
    const component = Renderer.create(<Loader message="test" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Loader should be rendered with given style", () => {
    const component = Renderer.create(<Loader style={{ background: "red" }} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
