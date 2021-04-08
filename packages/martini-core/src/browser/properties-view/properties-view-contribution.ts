import { Command } from "@theia/core";
import { AbstractViewContribution } from "@theia/core/lib/browser";
import messages from "martini-messages/lib/messages";
import { PropertiesViewWidget } from "./properties-view-widget";

export const TogglePropertiesViewCommand: Command = {
    id: "martini.togglePropertiesView",
    label: messages.toggle_props_view
};

export class PropertiesViewContribution extends AbstractViewContribution<PropertiesViewWidget> {
    constructor() {
        super({
            widgetId: PropertiesViewWidget.ID,
            widgetName: messages.properties,
            toggleKeybinding: "ctrlcmd+shift+O",
            toggleCommandId: TogglePropertiesViewCommand.id,
            defaultWidgetOptions: {
                area: "right"
            }
        });
    }
}
