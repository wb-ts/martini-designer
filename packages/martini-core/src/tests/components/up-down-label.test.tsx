import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as Renderer from "react-test-renderer";
import {UpDownLabel} from "../../browser/components/up-down-label";

Enzyme.configure({adapter: new Adapter()});

test("UpDownLabel should be rendered", () => {
    const component = Renderer.create(<UpDownLabel toolTip="Test" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
