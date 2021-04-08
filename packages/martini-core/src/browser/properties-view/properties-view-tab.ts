import { PropertiesViewPage } from "./properties-view-page";

export const PropertiesViewTab = Symbol("PropertiesViewTab");

/**
 * Represents a tab to rendered in a TabbedPropertiesViewPage.
 */
export interface PropertiesViewTab extends PropertiesViewPage {
    /**
     * The name of the tab.
     */
    name: string;

    /**
     * The order of the tab, ordered from lowest to highest value for left to right tab.
     */
    order: number;

    /**
     * Returns whether or not this tab should be visible, based on the given selection.
     * @param selection the current selection
     */
    isVisible(selection: object): boolean;
}
