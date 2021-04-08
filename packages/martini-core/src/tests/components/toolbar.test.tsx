import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { ToolBar, ToolBarItem } from "../../browser/components/toolbar";

Enzyme.configure({ adapter: new Adapter() });

test("ToolBar should be rendered without any items", () => {
    const component = Renderer.create(<ToolBar/>);
    const tree = component.toJSON();
     expect(tree).toMatchSnapshot();
});

test("ToolBar should be rendered with toolbar items", () => {
    const component = Renderer.create(
        <ToolBar>
            <ToolBarItem label="item 1" tooltip="this is item 1" iconClass="test1" />
            <ToolBarItem label="item 2" tooltip="this is item 2" iconClass="test2" />
            <ToolBarItem label="item 3" tooltip="this is item 3" iconClass="test3" />
        </ToolBar>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("ToolBar should be rendered with disabled icon classes", () => {
    const component = Renderer.create(
        <ToolBar>
            <ToolBarItem label="item 1" iconClass="test1" disabledIconClass="disabled1" enabled={false} />
            <ToolBarItem label="item 2" iconClass="test2" />
        </ToolBar>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("ToolBar should be rendered with toggled item", () => {
    const component = Renderer.create(
        <ToolBar>
            <ToolBarItem label="item 1" toggled={false} />
            <ToolBarItem label="item 2" toggled={true} />
        </ToolBar>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Clicking a toolbar item should call onClick", () => {
    let clicked;
    const toolBar = Enzyme.shallow(<ToolBar>
        <ToolBarItem label="item 1" onClick={() => clicked = "item 1"} />
        <ToolBarItem label="item 2" onClick={() => clicked = "item 2"} />
    </ToolBar>);
    toolBar.find(ToolBarItem).at(1).simulate("click");
    expect(clicked).toBe("item 2");
});
