
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { TextCellEditor } from "../../browser/components/cell-editors";
import { TableEditor, TableEditorColumn } from "../../browser/components/table-editor";
import { act } from 'react-dom/test-utils';

Enzyme.configure({ adapter: new Adapter() });

interface Hero {
    number: number;
    name: string;
    power: string;
    remark?: string;
}

const columns: TableEditorColumn<any>[] = [
    {
        Header: "Number",
        accessor: "number",
        id: "number"
    },
    {
        Header: "Name",
        accessor: "name",
        id: "name"
    },
    {
        Header: "Power",
        accessor: "power",
        id: "power"
    },
    {
        Header: "Comment",
        accessor: "remark",
        id: "remark",
        cellEditor: props => (<TextCellEditor {...props} />)
    }
];

const createHero = (number: number, name: string, power: string): Hero => ({
    number,
    name,
    power
});

const heroes: Hero[] = [
    createHero(1, "Luther", "Super Strength"),
    createHero(2, "Diego", "Perfect Aim"),
    createHero(3, "Allison", "Mind Control"),
    createHero(4, "Klaus", "Speak to the Dead")
];

test("TableEditor should be rendered without toolbar", () => {
    const component = Renderer.create(
        <TableEditor
            tableProps={{
                columns,
                data: heroes
            }}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("TableEditor should be rendered with toolbar", () => {
    const component = Renderer.create(
        <TableEditor
            tableProps={{
                columns,
                data: heroes
            }}
            onAdd={async () => true}
            onDelete={async () => true}
            onEdit={async () => { }}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("TableEditor should be rendered with add toolbar item", () => {
    const component = Renderer.create(
        <TableEditor
            tableProps={{
                columns,
                data: heroes
            }}
            onAdd={async () => true}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("TableEditor should be rendered with edit toolbar item", () => {
    const component = Renderer.create(
        <TableEditor
            tableProps={{
                columns,
                data: heroes
            }}
            onEdit={async () => { }}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("TableEditor should be rendered with delete toolbar item", () => {
    const component = Renderer.create(
        <TableEditor
            tableProps={{
                columns,
                data: heroes
            }}
            onDelete={async () => true}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Edit should enable the cell editor and call onEdit when value is applied", async () => {
    let value;
    let tableEditor: Enzyme.ReactWrapper;
    await act(async () => {
        tableEditor = Enzyme.mount(
            <TableEditor
                tableProps={{
                    columns: [columns[columns.length - 1]],
                    data: heroes,
                    selectedRows: [0]
                }}
                onEdit={async (_, __, _value) => { value = _value; }}
            />
        );
        tableEditor!.find(".item").simulate("click");
    });

    tableEditor!.update();
    tableEditor!.find("input").simulate("change", {
        target: {
            value: "test"
        }
    });
    await act(async () => {
        tableEditor!.find("input").simulate("keyup", {
            key: "Enter",
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        });
    });
    expect(value).toBe("test");
});

test("Edit should enable the cell editor and call onEdit when value is applied 2", async () => {
    let value;
    let tableEditor: Enzyme.ReactWrapper;
    await act(async () => {
        tableEditor = Enzyme.mount(
            <TableEditor
                tableProps={{
                    columns,
                    data: heroes,
                    selectedRows: [0]
                }}
                onEdit={async (_, __, _value) => { value = _value; }}
            />
        );
        tableEditor!.find(".edit-button").at(0).simulate("click");
    });
    tableEditor!.update();
    tableEditor!.find("input").simulate("change", {
        target: {
            value: "test"
        }
    });
    await act(async () => {
        tableEditor!.find("input").simulate("keyup", {
            key: "Enter",
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        });
    });
    expect(value).toBe("test");
});

