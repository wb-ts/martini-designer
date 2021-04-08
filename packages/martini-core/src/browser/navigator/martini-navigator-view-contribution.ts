import { Command, CommandRegistry, ContributionProvider, MenuModelRegistry, MenuPath } from "@theia/core";
import { AbstractViewContribution, CompositeTreeNode, ExpandableTreeNode } from "@theia/core/lib/browser";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { inject, injectable, named } from "inversify";
import messages from "martini-messages/lib/messages";
import { DeleteCommand, RenameCommand } from "../martini-ide-contribution";
import { WizardCommandContribution, WizardContribution } from "../wizard/wizard-contribution";
import { Navigator } from "./martini-navigator-view-widget";

export const MARTINI_IDE_CATEGORY = "Martini";

export const NAVIGATOR_VIEW_CONTEXT_MENU: MenuPath = ["martini-navigator-context-menu"];

export namespace NavigatorViewContextMenu {
    export const EDIT = [...NAVIGATOR_VIEW_CONTEXT_MENU, "edit"];
    export const NEW = [...EDIT, "new"];
}

export const CollapseAllCommand: Command = {
    id: "martini.navigator.collapseAll",
    label: messages.collapse_all,
    iconClass: "martini-icon martini-collapse-all-icon"
};

@injectable()
export class NavigatorViewContribution extends AbstractViewContribution<Navigator>
    implements TabBarToolbarContribution {
    static readonly NAVIGATOR_VIEW_TOGGLE_COMMAND_ID = "martini.navigator.toggle";

    @inject(ContributionProvider)
    @named(WizardContribution)
    private readonly contributionProvider: ContributionProvider<WizardContribution>;

    constructor() {
        super({
            widgetId: Navigator.ID,
            widgetName: messages.navigator,
            toggleCommandId: NavigatorViewContribution.NAVIGATOR_VIEW_TOGGLE_COMMAND_ID,
            defaultWidgetOptions: {
                area: "left"
            }
        });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
        commands.registerCommand(CollapseAllCommand, {
            execute: () => this.collapseAll(),
            isEnabled: widget => this.isNavigatorWidget(widget),
            isVisible: widget => this.isNavigatorWidget(widget)
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: CollapseAllCommand.id,
            command: CollapseAllCommand.id
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: DeleteCommand.id
        });
        menus.registerMenuAction(NAVIGATOR_VIEW_CONTEXT_MENU, {
            commandId: RenameCommand.id
        });
        menus.registerSubmenu(NavigatorViewContextMenu.NEW, messages.new, {
            iconClass: "martini-icon martini-add-icon"
        });
        this.contributionProvider.getContributions().forEach(wizard => {
            const menuPath = wizard.menuGroup
                ? [...NavigatorViewContextMenu.NEW, wizard.menuGroup]
                : NavigatorViewContextMenu.NEW;
            menus.registerMenuAction(menuPath, {
                commandId: WizardCommandContribution.getCommandId(wizard)
            });
        });
    }

    private isNavigatorWidget(widget: any): boolean {
        return widget instanceof Navigator && widget.id === Navigator.ID;
    }

    private async collapseAll() {
        const widget = this.tryGetWidget();
        if (widget) {
            await widget.model.collapseAll(widget.model.root as CompositeTreeNode);
            widget.model.expandNode(widget.model.root as ExpandableTreeNode);
        }
    }
}
