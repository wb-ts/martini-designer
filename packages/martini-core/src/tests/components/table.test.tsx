import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { Table, TableColumn, CellClickEvent } from "../../browser/components/table";

Enzyme.configure({ adapter: new Adapter() });

interface Person {
    firstName: string;
    lastName: string;
    age: number;
}

const columns: TableColumn[] = [
    {
        Header: "First Name",
        accessor: "firstName"
    },
    {
        Header: "Last Name",
        accessor: "lastName"
    },
    {
        Header: "Age",
        accessor: "age"
    }
];

const createPerson = (firstName: string, lastName: string, age: number): Person => ({
    firstName,
    lastName,
    age
});

const people: Person[] = [
    createPerson("Geralt", "Of Rivia", 94),
    createPerson("Yennefer", "Of Vengerberg", 100),
    createPerson("Cirilla", "Of Cintra", 100)
];

test("Table should be rendered with columns and rows", () => {
    const component = Renderer.create(
        <Table columns={columns} data={people} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Table should be rendered with columns but no rows", () => {
    const component = Renderer.create(
        <Table columns={columns} data={[]} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Clicking a cell should call onClick", () => {
    let event: CellClickEvent | undefined;
    const handleCellClick = (e: CellClickEvent) => {
        event = e;
    };
    const table = Enzyme.shallow(
        <Table columns={columns} data={people} onCellClick={handleCellClick} />
    );
    table.find('.td').at(0).simulate("click", {});
    expect(event).not.toBeUndefined();
    expect(event!.columnId).toBe("firstName");
    expect(event!.rowIndex).toBe(0);
});

test("Table should be rendered with the given selected rows", () => {
    const component = Renderer.create(
        <Table
            columns={columns}
            data={people}
            selectedRows={[1, 2]}
        />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Pressing arrow down should select the first row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0]);
});

test("Pressing arrow up should select the last row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([2]);
});

test("Pressing arrow down should select the next row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([1]);
});

test("Pressing arrow down with last row selected should select the first row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[2]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0]);
});

test("Pressing arrow up should select the previous row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[1]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0]);
});

test("Pressing arrow up with the first row selected should select the last row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([2]);
});

test("Pressing arrow down with shift key should spread the selection to the next row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0, 1]);
});

test("Pressing arrow up with shift key should spread the selection to the previous row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[1]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([1, 0]);
});

test("Pressing arrow down with shift key should spread the selection to the next row skipping already selected rows", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={[...people, createPerson("", "", 0)]}
            selectedRows={[0, 1, 2]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0, 1, 2, 3]);
});

test("Pressing arrow up with shift key should spread the selection to the previous row skipping already selected rows", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={[...people, createPerson("", "", 0)]}
            selectedRows={[3, 2, 1]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([3, 2, 1, 0]);
});

test("Pressing arrow down should shrink selection", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={[...people]}
            selectedRows={[2, 1, 0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowDown",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([2, 1]);
});

test("Pressing arrow up should shrink selection", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={[...people]}
            selectedRows={[0, 1, 2]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.simulate("keydown", {
        key: "ArrowUp",
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0, 1]);
});

test("Clicking a row should select it", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.find('.td').at(0).simulate("click", {});
    expect(selectedRows).toStrictEqual([0]);
});

test("Clicking a row should select it and unselect the previous selected row", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.find('.td').at(4).simulate("click", {});
    expect(selectedRows).toStrictEqual([1]);
});

test("Clicking a row with meta key should add it to the selection", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.find('.td').at(4).simulate("click", { metaKey: true });
    expect(selectedRows).toStrictEqual([0, 1]);
});

test("Clicking a selected row with meta key should remove it from the selection", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0, 1]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.find('.td').at(0).simulate("click", { metaKey: true });
    expect(selectedRows).toStrictEqual([1]);
});

test("Clicking a selected row with shift key should select a range of rows", () => {
    let selectedRows: number[] = [];
    const table = Enzyme.shallow(
        <Table
            columns={columns}
            data={people}
            selectedRows={[0]}
            onSelectionChange={_selectedRows => selectedRows = _selectedRows}
        />
    );
    table.find('.td').at(7).simulate("click", {
        shiftKey: true,
        preventDefault: jest.fn()
    });
    expect(selectedRows).toStrictEqual([0, 1, 2]);
});
