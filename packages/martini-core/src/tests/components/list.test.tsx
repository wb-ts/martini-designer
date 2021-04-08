import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { List, ListItem } from "../../browser/components/list";

Enzyme.configure({ adapter: new Adapter() });

test("Selected list item is rendered with different background color", () => {
    const items: ListItem[] = [
        {
            label: "Item 1",
            selected: true,
            iconClass: "test-icon"
        },
        {
            label: "Item 2",
            iconClass: "test-icon"
        }
    ];
    const component = Renderer.create(
        <List items={items} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("List is rendered with a search field", () => {
    const items: ListItem[] = [
        {
            label: "Item 1",
            selected: true,
            iconClass: "test-icon"
        },
        {
            label: "Item 2",
            iconClass: "test-icon"
        }
    ];
    const component = Renderer.create(
        <List items={items} filtered={true} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("No selected list items are rendered", () => {
    const items: ListItem[] = [
        {
            label: "Item 1",
            iconClass: "test-icon"
        },
        {
            label: "Item 2",
            iconClass: "test-icon"
        }
    ];
    const component = Renderer.create(
        <List items={items} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Clicking a list item should select it", () => {
    const items: ListItem[] = ["Item 1", "Item 2"].map(label => ({ label }));
    const list = Enzyme.shallow(<List items={items} />);
    list.find(".item").at(0).simulate("click");
    expect(list.find(".item").at(0).hasClass("item-selected")).toBe(true);
    expect(list.find(".item").at(1).hasClass("item-selected")).toBe(false);
});

test("Selecting a list item should call onSelectionChanged", () => {
    const items: ListItem[] = ["Item 1", "Item 2"].map(label => ({ label }));
    let selectedItem: ListItem = { label: "unknown" };
    const list = Enzyme.shallow(<List items={items} onSelectionChanged={item => selectedItem = item} />);
    list.find(".item").at(0).simulate("click");
    expect(selectedItem).toMatchObject({ label: "Item 1" });
});

test("Changing text should call onTextChange", () => {
    let eventText: string = "";
    const list = Enzyme.shallow(<List
        items={[]}
        filtered={true}
        onTextChange={text => eventText = text}
    />);
    list.find("input").at(0).simulate("change", {
        target: {
            value: "test"
        }
    });
    expect(eventText).toBe("test");
});

describe("When pressing key", () => {
    const items: ListItem[] = ["Item 1", "Item 2", "Item 3"].map(label => ({ label }));

    test("down should select the item below", () => {
        const list = Enzyme.mount(<List items={items} />);
        list.find(".item").at(0).simulate("click");
        list.find(".item").at(0).simulate("keydown", { key: "ArrowDown" });
        expect(list.find(".item").at(0).hasClass("item-selected")).toBe(false);
        expect(list.find(".item").at(1).hasClass("item-selected")).toBe(true);
        expect(list.find(".item").at(2).hasClass("item-selected")).toBe(false);
    });

    test("up should select the item below", () => {
        const list = Enzyme.mount(<List items={items} />);
        list.find(".item").at(1).simulate("click");
        list.find(".item").at(1).simulate("keydown", { key: "ArrowUp" });
        expect(list.find(".item").at(0).hasClass("item-selected")).toBe(true);
        expect(list.find(".item").at(1).hasClass("item-selected")).toBe(false);
        expect(list.find(".item").at(2).hasClass("item-selected")).toBe(false);
    });

    test("down on the last item should select the first item", () => {
        const list = Enzyme.mount(<List items={items} />);
        list.find(".item").at(2).simulate("click");
        list.find(".item").at(2).simulate("keydown", { key: "ArrowDown" });
        expect(list.find(".item").at(0).hasClass("item-selected")).toBe(true);
        expect(list.find(".item").at(1).hasClass("item-selected")).toBe(false);
        expect(list.find(".item").at(2).hasClass("item-selected")).toBe(false);
    });

    test("up on the first item should select the last item", () => {
        const list = Enzyme.mount(<List items={items} />);
        list.find(".item").at(0).simulate("click");
        list.find(".item").at(0).simulate("keydown", { key: "ArrowUp" });
        expect(list.find(".item").at(0).hasClass("item-selected")).toBe(false);
        expect(list.find(".item").at(1).hasClass("item-selected")).toBe(false);
        expect(list.find(".item").at(2).hasClass("item-selected")).toBe(true);
    });
});

describe("When searching", () => {
    const items: ListItem[] = ["Item 1", "Item 2", "Item 3"].map(label => ({ label }));

    test("empty search should show all", () => {
        const list = Enzyme.mount(<List items={items} filtered={true} />);
        list.find(".theia-input").at(0).simulate("change", {
            target: {
                value: ""
            }
        });
        expect(list.find(".item").length).toBe(3);
    });

    test("items should be filtered", () => {
        const list = Enzyme.mount(<List items={items} filtered={true} />);
        list.find(".theia-input").at(0).simulate("change", {
            target: {
                value: "1"
            }
        });
        expect(list.find(".item").length).toBe(1);
    });

    test("invalid search should filter out all", () => {
        const list = Enzyme.mount(<List items={items} filtered={true} />);
        list.find(".theia-input").at(0).simulate("change", {
            target: {
                value: "test"
            }
        });
        expect(list.find(".item").length).toBe(0);
    });
});
