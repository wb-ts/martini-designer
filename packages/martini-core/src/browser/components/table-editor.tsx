import { CommandRegistry } from "@phosphor/commands";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { CellEditorProvider } from "./cell-editors";
import { CellClickEvent, Table, TableColumn, TableProps } from "./table";
import { ToolBar, ToolBarItem } from "./toolbar";

const Styles = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content;
    grid-column-gap: 4px;
    overflow: hidden;

    > div {
        outline: none;
    }

    .table {
        .tbody {
            height: 100%;
            background-color: var(--theia-input-background);
        }
    }

    .cell {
        padding-left: 4px;
        width: 100%;
        position: relative;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;

        .edit-button {
            visibility: hidden;
            position: absolute;
            filter: drop-shadow(0px 0px 1px black);
            cursor: pointer;
            right: 0;
        }

        :hover {
            .edit-button {
                visibility: visible;
            }
        }
    }
`;

export type TableEditorColumn<T> = TableColumn & {
    cellEditor?: CellEditorProvider<T>;
    onEditButtonPress?: (rowIndex: number, value: any) => Promise<void>;
};

export namespace TableEditorColumn {
    export function is(object: object): object is TableEditorColumn<any> {
        return !!object && ("cellEditor" in object || "onEditButtonPress" in object);
    }

    export function isEditable(column: TableEditorColumn<any>): column is TableEditorColumn<any> {
        return column.cellEditor !== undefined || column.onEditButtonPress !== undefined;
    }
}

export interface TableEditorProps {
    tableProps: TableProps;
    style?: React.CSSProperties;
    defaultEditColumnId?: string;
    onAdd?: () => Promise<boolean | string>;
    onDelete?: (rows: number[]) => Promise<boolean>;
    onEdit?: (rowIndex: number, columnId: string, value: any) => Promise<void>;
    onSelectionChange?: (selectedRows: number[]) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({
    tableProps,
    style,
    onAdd,
    onDelete,
    onEdit,
    onSelectionChange,
    defaultEditColumnId = tableProps.columns.find(c => TableEditorColumn.is(c) && c.cellEditor)?.id,
    children
}) => {
    const [selectedRows, setSelectedRows] = React.useState<number[]>(tableProps.selectedRows || []);
    const [editedColumnId, setEditedColumnId] = React.useState<string>();
    const tableRef = React.useRef<HTMLDivElement>();

    const handleAdd = async () => {
        if (onAdd) {
            const length = tableProps.data.length;
            const result = await onAdd();
            if (result) {
                setSelectedRows([length]);
                setTimeout(() => {
                    if (typeof result === "string")
                        handleEdit(result);
                    else
                        handleEdit();
                });
            }
        }
        tableRef.current?.focus();
    };
    const handleDelete = async () => {
        if (onDelete && await onDelete(selectedRows)) {
            if (selectedRows.length === 1)
                setSelectedRows([Math.max(0, selectedRows[0] - 1)]);
            else
                setSelectedRows([0]);
        }
        tableRef.current?.focus();
    };

    const handleEdit = (columnId?: string) => {
        setEditedColumnId(columnId || defaultEditColumnId);
    };

    const handleToolBarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.key === "Delete" && onDelete) {
            handleDelete();
            e.preventDefault();
            e.stopPropagation();
        }
        else if (e.key === 'a' && e.altKey && onAdd) {
            handleAdd();
            e.preventDefault();
            e.stopPropagation();
        }
        else if ((e.key === "F2" || e.key === "Enter") && onEdit) {
            handleEdit();
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleCellDoubleClick = (e: CellClickEvent) => {
        const column = tableProps.columns.find(col => col.id === e.columnId);
        if (column && TableEditorColumn.is(column) && column.onEditButtonPress) {
            e.mouseEvent.stopPropagation();
            e.mouseEvent.preventDefault();
            handleEditButtonClick(column, e.rowIndex, e.value);
        }
        else if (column && TableEditorColumn.is(column) && column.cellEditor) {
            e.mouseEvent.stopPropagation();
            e.mouseEvent.preventDefault();
            setEditedColumnId(e.columnId);
        }
    };

    const handleSelectionChange = (selectedRows: number[]) => {
        setSelectedRows(selectedRows);
        if (onSelectionChange)
            onSelectionChange(selectedRows);
    };

    const handleEditButtonClick = async (column: TableEditorColumn<any>, row: number, value: any) => {
        if (column.onEditButtonPress) {
            await column.onEditButtonPress(row, value);
            tableRef.current?.focus();
        }
        else
            handleEdit(column.id);
    };

    const proxiedColumns = tableProps.columns.map(column => {
        const proxy: TableColumn = {
            ...column,
            Cell: props => {
                if (column.id === editedColumnId && TableEditorColumn.is(column) && column.cellEditor && selectedRows[0] === props.row.index)
                    return column.cellEditor!({
                        editor: {
                            value: props.value,
                            onApply: async value => {
                                if (onEdit) {
                                    await onEdit(props.row.index, props.column.id, value);
                                    setEditedColumnId(undefined);
                                    setSelectedRows([props.row.index]);
                                    tableRef.current?.focus();
                                }
                            },
                            onCancel: () => {
                                setEditedColumnId(undefined);
                                tableRef.current?.focus();
                            },
                            readOnly: false
                        }
                    });

                return <div className="cell">
                    {props.value ? <span title={props.value}>{props.value}</span> : <span>&nbsp;</span>}
                    {
                        TableEditorColumn.is(column) &&
                        TableEditorColumn.isEditable(column) &&
                        <span
                            className="edit-button martini-tree-icon martini-edit-icon"
                            title={messages.edit}
                            onClick={() => handleEditButtonClick(column, props.row.index, props.value)}
                        />
                    }
                </div>;
            }
        };

        return proxy;
    });

    return <Styles style={style} onKeyUp={handleKeyUp}>
        <Table
            {...tableProps}
            columns={proxiedColumns}
            selectedRows={selectedRows}
            rowSelectionEnabled={true}
            focusable={true}
            onSelectionChange={handleSelectionChange}
            onCellDoubleClick={handleCellDoubleClick}
            tableRef={tableRef}
        />
        <ToolBar layout="vertical" onMouseDown={e => handleToolBarMouseDown(e)}>
            {onAdd && <ToolBarItem
                iconClass="martini-add-icon"
                onClick={handleAdd}
                tooltip={`${messages.add} (${CommandRegistry.formatKeystroke("Alt A")})`}
            />}
            {(onEdit && tableProps.columns.length === 1) && <ToolBarItem
                iconClass="martini-edit-icon"
                onClick={() => handleEdit()}
                enabled={tableProps.data.length > 0 && selectedRows.length > 0}
                tooltip={`${messages.edit} (${CommandRegistry.formatKeystroke("F2")})`}
            />}
            {onDelete && <ToolBarItem
                iconClass="martini-delete-icon"
                enabled={tableProps.data.length > 0 && selectedRows.length > 0}
                onClick={handleDelete}
                tooltip={`${messages.delete} (${CommandRegistry.formatKeystroke("Delete")})`}
            />}
            {children}
        </ToolBar>
    </Styles>;
};

