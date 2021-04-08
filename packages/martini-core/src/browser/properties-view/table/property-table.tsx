import { CommandRegistry } from "@phosphor/commands";
import { Menu } from "@phosphor/widgets";
import { toString } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { CellClickEvent, Table, TableColumn } from "../../components/table";
import { PropertyDescriptor } from "./property-descriptor";

export interface PropertiesTableProps {
    descriptors: PropertyDescriptor[];
    onApply: (descriptor: PropertyDescriptor, newValue: any) => void;
}

const PropertyTableStyles = styled.div`
    overflow-y: hidden;
    height: 100%;

    .table {
        .td {
            border-bottom: 1px solid var(--martini-table-border);
        }
    }
`;

const PropertyNameCell = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content;
    width: 100%;

    .reset {
        cursor: pointer;
        visibility: hidden;
    }

    :hover .reset {
        visibility: visible;
    }
`;

export const PropertyTable: React.FC<PropertiesTableProps> = ({
    descriptors,
    onApply
}) => {
    const reset = (descriptor: PropertyDescriptor) => {
        if (onApply && !descriptor.readOnly)
            onApply(descriptor, descriptor.defaultValue);
    };

    const handleCellClick = (e: CellClickEvent) => {
        const descriptor = e.value as PropertyDescriptor;
        // only show reset menu for the property name column
        if (!descriptor || !descriptor.hasDefaultValue || descriptor.readOnly ||
            e.columnId !== "displayName" || e.mouseEvent.button !== 2)
            return;

        const commands = new CommandRegistry();
        commands.addCommand("reset", {
            label: messages.reset_default,
            execute: () => reset(descriptor)
        });

        const menu = new Menu({
            commands
        });
        menu.addItem({
            command: "reset"
        });
        menu.open(e.mouseEvent.clientX, e.mouseEvent.clientY);
        e.mouseEvent.preventDefault();
    };

    const columns: TableColumn[] = [
        {
            Header: "Property",
            accessor: "displayName",
            cellPadding: "0 0 0 4px",
            Cell: props => {
                const descriptor = props.row.original as PropertyDescriptor;
                return <PropertyNameCell
                    title={descriptor.description}
                >
                    {descriptor.displayName}
                    {(!descriptor.readOnly && (descriptor.hasDefaultValue || descriptor.defaultValue !== undefined)) && <div
                        title={messages.reset_default}
                        className="reset martini-tree-icon martini-reset-icon"
                        onClick={() => reset(descriptor)}
                    />}
                </PropertyNameCell>;
            }
        },
        {
            Header: "Value",
            Cell: props => {
                const descriptor = props.data[props.row.index] as PropertyDescriptor;

                return !descriptor.getCellEditor ?
                    <div style={{ paddingLeft: "4px" }}>{toString(descriptor.value)}</div> :
                    descriptor.getCellEditor({
                        editor: {
                            get value() { return descriptor.value; },
                            onApply: value => {
                                if (!descriptor.readOnly)
                                    onApply(descriptor, value);
                            },
                            validate: descriptor.validate,
                            readOnly: descriptor.readOnly
                        }
                    });
            }
        }
    ] as TableColumn[];

    return <PropertyTableStyles>
        <Table
            columns={columns}
            data={descriptors}
            onCellClick={handleCellClick}
            rowSelectionEnabled={false}
        />
    </PropertyTableStyles>;
};
