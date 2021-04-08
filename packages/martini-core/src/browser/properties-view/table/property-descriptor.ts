import { Event } from "@theia/core";
import { CellEditorProvider } from "../../components/cell-editors";

export interface PropertyDescriptor {
    target: any;
    name: string;
    displayName: string;
    description: string;
    readOnly: boolean;
    value: any;
    /**
     * Used to reset the property.
     */
    defaultValue?: any;
    /**
     * Used to determine if the reset menu should be shown.
     */
    hasDefaultValue?: boolean;
    validate?: (value: any) => string | undefined;
    getCellEditor?: CellEditorProvider<any>;
}

export interface PropertySource {
    getPropertyDescriptors(): PropertyDescriptor[];

    setProperty(name: string, newValue: any): void;

    iconClass?: string;
    title?: string;
    onPropertyChange?: Event<void>;

    dispose?(): void;
}

export interface PropertySourceFactory {
    support(selection: object): boolean;

    getPropertySource(selection: object): PropertySource;
}

export const PropertySourceFactory = Symbol("PropertySourceFactory");
