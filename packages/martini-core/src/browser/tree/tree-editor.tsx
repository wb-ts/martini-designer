import * as React from "react";

export const TreeEditor = Symbol("TreeEditor");

export interface TreeEditor {
    canEdit(element: any, property?: string): boolean;

    getCellEditor(element: any, property: string | undefined, onDone: () => void): React.ReactNode;
}
