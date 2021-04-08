
import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import { Icon, OverlayIcon } from "../../browser/components/icon-overlay";

Enzyme.configure({ adapter: new Adapter() });

test("Icon should be rendered without overlay icon", () => {
    const component = Renderer.create(<Icon iconClass="test" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Icon should be rendered with one overlay icon", () => {
    const component = Renderer.create(<Icon iconClass="test">
        <OverlayIcon iconClass="other" position="top-right" />
    </Icon>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Icon should be rendered with multiple overlay icons", () => {
    const component = Renderer.create(<Icon iconClass="test">
        <OverlayIcon iconClass="test1" position="top-right" />
        <OverlayIcon iconClass="test2" position="top-left" />
        <OverlayIcon iconClass="test2" position="bottom-right" />
        <OverlayIcon iconClass="test2" position="bottom-left" />
    </Icon>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
