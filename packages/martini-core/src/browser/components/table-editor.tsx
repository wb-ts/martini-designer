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

    > div {
        outline: none;
    }

    .table {
        .tbody {
            height: 100%;
            background-color: var(--theia-input-background);
        }
    }
`;
export type TableEditorColumn<T> = TableColumn & {
    cellEditor?: CellEditorProvider<T>;
    alwaysShowCellEditor?: boolean;
};

export namespace TableEditorColumn {
    export function is(object: object): object is TableEditorColumn<any> {
        return !!object && "cellEditor" in object;
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
            const result = await onAdd();
            if (result) {
                setSelectedRows([tableProps.data.length - 1]);
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
        setEditedColumnId(e.columnId);
    };

    const handleSelectionChange = (selectedRows: number[]) => {
        setSelectedRows(selectedRows);
        if (onSelectionChange)
            onSelectionChange(selectedRows);
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

                return <div style={{ paddingLeft: "4px" }}>{props.value}</div>;
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
            {onEdit && <ToolBarItem
                iconClass="martini-edit-icon"
                onClick={() => handleEdit()}
                enabled={tableProps.data.length > 0 && selectedRows.length > 0}
                tooltip={`${messages.edit_choices_title} (${CommandRegistry.formatKeystroke("F2")})`}
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

