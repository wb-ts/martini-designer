import { ElementExt } from '@phosphor/domutils';
import { isEqual, pull } from "lodash";
import * as React from "react";
import { Cell, Column, ColumnGroup, ColumnInstance, ColumnInterfaceBasedOnValue, TableCellProps, TableHeaderProps, useFlexLayout, useResizeColumns, UseResizeColumnsColumnOptions, UseResizeColumnsColumnProps, useTable } from "react-table";
import styled from "styled-components";

const Styles = styled.div`
    display: block;
    overflow-x: auto;
    width: 100%;
    height: 100%;
    overflow-y: hidden;

    .table {
        border-spacing: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: overlay;

        .thead {
            flex-shrink: 0;
        }

        .tbody {
            flex: 1;
            overflow-y: auto;
        }

        .tr {
            :last-child {
                .td {
                    border-bottom: 0;
                }
            }
            .selected {
                background-color: var(--theia-list-activeSelectionBackground);
            }
        }

        .th {
            user-select: none;
            padding: 0.5rem;
        }

        .td {
            min-height: 25px;
        }

        .th,
        .td {
            margin: 0;
            border-right: 1px solid var(--martini-table-border);
            overflow-x: hidden;
            position: relative;

            :last-child {
                border-right: 0;
            }

            .resizer {
                right: 0;
                width: 10px;
                height: 100%;
                position: absolute;
                top: 0;
                z-index: 1;
                touch-action :none;
            }

            .resizer:hover {
                background-color: var(--theia-scrollbarSlider-background);
            }
        }
    }
`;

export type TableColumn = Column<any> & UseResizeColumnsColumnOptions<any> & ColumnInterfaceBasedOnValue<any> & {
    /**
     * Cell padding.
     */
    cellPadding?: string;
};

export interface CellClickEvent {
    columnId: string;
    rowIndex: number;
    value: any;
    mouseEvent: React.MouseEvent<HTMLDivElement>;
}

export interface TableProps {
    columns: TableColumn[];
    data: any[];
    /**
     * Defaults to true.
     */
    showTableHeader?: boolean;
    focusable?: boolean;
    onCellClick?: (e: CellClickEvent) => void;
    onCellDoubleClick?: (e: CellClickEvent) => void;
    /**
     * Defaults to true.
     */
    rowSelectionEnabled?: boolean;
    /**
     * Defaults to true.
     */
    multiSelection?: boolean;
    selectedRows?: number[];
    onSelectionChange?: (selectedRows: number[]) => void;
    tableRef?: React.MutableRefObject<any>;
}

export const Table: React.FC<TableProps> = ({
    columns,
    data,
    showTableHeader = true,
    focusable,
    onCellClick,
    onCellDoubleClick,
    rowSelectionEnabled = true,
    multiSelection = true,
    selectedRows: selectedRowsProp,
    onSelectionChange,
    tableRef
}) => {
    const defaultColumn = React.useMemo(
        () => ({
            minWidth: 30,
            width: 100,
            maxWidth: 400
        } as Partial<TableColumn>),
        []
    );
    const headerProps = (props: TableHeaderProps, { column }: any) => getStyles(props, column.align);

    const cellProps = (props: TableCellProps, { cell }: any) => getStyles(props, cell.column.align, cell.column.cellPadding);

    const getStyles = (props: TableHeaderProps | TableCellProps, align = "left", padding?: string) => [
        props,
        {
            style: {
                justifyContent: align === "right" ? "flex-end" : "flex-start",
                alignItems: "center",
                display: "flex",
                overflow: "visible",
                padding
            }
        }
    ];

    const {
        getTableProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable<any>({
        columns,
        data,
        defaultColumn
    }, useFlexLayout, useResizeColumns);

    const [selectedRows, setSelectedRows] = React.useState<number[]>(selectedRowsProp || []);
    const selectedRowRef = React.useRef<HTMLDivElement>(null);
    const lastMouseSelectedRow = React.useRef<number>();

    React.useEffect(() => setSelectedRows(selectedRowsProp || []), [selectedRowsProp]);

    React.useEffect(() => {
        if (selectedRowRef.current)
            ElementExt.scrollIntoViewIfNeeded(selectedRowRef.current.parentElement!, selectedRowRef.current);
    }, [selectedRows]);

    const handleSelectionChange = (selectedRows: number[]) => {
        if (onSelectionChange)
            onSelectionChange(selectedRows);
        if (!selectedRowsProp)
            setSelectedRows(selectedRows);
    };

    const handleCellClick = (e: React.MouseEvent<HTMLDivElement>, cell: Cell<any>) => {
        if (rowSelectionEnabled) {
            const _selectedRows = [...selectedRows];

            if (e.metaKey && multiSelection) {
                if (_selectedRows.includes(cell.row.index)) {
                    pull(_selectedRows, cell.row.index);
                    lastMouseSelectedRow.current = _selectedRows[_selectedRows.length - 1];
                }
                else {
                    _selectedRows.push(cell.row.index);
                    lastMouseSelectedRow.current = cell.row.index;
                }
            }
            else if (e.shiftKey && _selectedRows.length > 0 && multiSelection) {
                lastMouseSelectedRow.current = cell.row.index;
                const lastSelected = _selectedRows[_selectedRows.length - 1];
                e.preventDefault();
                if (document.getSelection)
                    document.getSelection()?.removeAllRanges();

                if (lastSelected < cell.row.index) {
                    for (let i = lastSelected + 1; i <= cell.row.index; i++) {
                        if (_selectedRows.includes(i))
                            pull(_selectedRows, i);
                        else
                            _selectedRows.push(i);
                    }
                }
                else if (lastSelected > cell.row.index) {
                    for (let i = lastSelected - 1; i >= cell.row.index; i--) {
                        if (_selectedRows.includes(i))
                            pull(_selectedRows, i);
                        else
                            _selectedRows.push(i);
                    }
                }
            }
            else {
                _selectedRows.splice(0, _selectedRows.length);
                _selectedRows.push(cell.row.index);
                lastMouseSelectedRow.current = cell.row.index;
            }

            if (!isEqual(selectedRows, _selectedRows))
                handleSelectionChange(_selectedRows);
        }
        if (onCellClick) {
            onCellClick({
                columnId: cell.column.id,
                rowIndex: cell.row.index,
                value: cell.row.original,
                mouseEvent: e
            });
        }
    };

    const handleCellDoubleClick = (e: React.MouseEvent<HTMLDivElement>, cell: Cell<any>) => {
        if (onCellDoubleClick) {
            onCellDoubleClick({
                columnId: cell.column.id,
                rowIndex: cell.row.index,
                value: cell.row.original,
                mouseEvent: e
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (rowSelectionEnabled && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            if (e.target instanceof HTMLInputElement)
                return;

            if (e.shiftKey && multiSelection) {
                const _selectedRows = [...selectedRows];
                const first = lastMouseSelectedRow.current || _selectedRows[0];
                const last = _selectedRows[_selectedRows.length - 1];
                if (e.key === "ArrowUp") {
                    let next = last - 1;
                    if (last <= first) {
                        while (next >= 0 && _selectedRows.includes(next)) {
                            pull(_selectedRows, next);
                            _selectedRows.push(next);
                            next--;
                        }
                        if (next >= 0)
                            _selectedRows.push(next);
                    } else if (last > first)
                        pull(_selectedRows, last);
                } else {
                    let next = last + 1;
                    if (last >= first && next < data.length) {
                        while (next < data.length && _selectedRows.includes(next)) {
                            pull(_selectedRows, next);
                            _selectedRows.push(next);
                            next++;
                        }

                        if (next < data.length)
                            _selectedRows.push(next);
                    } else if (last < first)
                        pull(_selectedRows, last);
                }

                handleSelectionChange(_selectedRows);
            } else {
                let index = selectedRows.length > 0 ? selectedRows[0] : -1;

                if (e.key === "ArrowUp")
                    index--;
                else
                    index++;

                if (index < 0)
                    index = data.length - 1;
                else if (index >= data.length)
                    index = 0;

                handleSelectionChange([index]);
            }

            e.preventDefault();
        }
    };

    return (
        <Styles
            tabIndex={focusable ? 0 : undefined}
            onKeyDown={handleKeyDown}
            ref={tableRef}
        >
            <div {...getTableProps()} className="table">
                {showTableHeader && <div className="thead">
                    {headerGroups.map(headerGroup => (
                        <div {...headerGroup.getHeaderGroupProps()} className="tr">
                            {headerGroup.headers.map(
                                // @ts-ignore
                                (column: ColumnInstance & ColumnGroup<any> & UseResizeColumnsColumnProps<any>) => (
                                    <div {...column.getHeaderProps(headerProps)} className="th">
                                        {column.render("Header")}
                                        {column.canResize && column.accessor !== undefined && (
                                            <div
                                                {...column.getResizerProps()}
                                                className="resizer"
                                            />
                                        )}
                                    </div>
                                ))}
                        </div>))}
                </div>}
                <div className="tbody">
                    {rows.map(row => {
                        prepareRow(row);

                        let className = "td";

                        if (selectedRows.includes(row.index))
                            className += " selected";

                        return (
                            <div {...row.getRowProps()} className="tr" ref={row.index === selectedRows[selectedRows.length - 1] ? selectedRowRef : undefined}>
                                {row.cells.map(cell => (
                                    <div {...cell.getCellProps(cellProps)}
                                        className={className}
                                        onClick={e => handleCellClick(e, cell)}
                                        onDoubleClick={e => handleCellDoubleClick(e, cell)}
                                        onContextMenu={e => handleCellClick(e, cell)}
                                    >
                                        {cell.render("Cell")}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Styles>
    );
};
