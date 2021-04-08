import { CommandRegistry as PhosphorCommandRegistry } from "@phosphor/commands";
import { Command, CommandRegistry, Emitter, MenuPath } from "@theia/core";
import { ContextMenuRenderer, KeybindingRegistry, ReactWidget } from "@theia/core/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";
import { ToolBar, ToolBarItem, ToolbarItemProps, ToolBarItemSeparator } from "./toolbar";

@injectable()
export class ToolbarWidget extends ReactWidget {
    @inject(CommandRegistry)
    protected commands: CommandRegistry;
    @inject(ContextMenuRenderer)
    protected menuRenderer: ContextMenuRenderer;
    @inject(KeybindingRegistry)
    protected keybindings: KeybindingRegistry;

    private readonly onMouseDownEmitter = new Emitter<React.MouseEvent>();
    readonly onMouseDown = this.onMouseDownEmitter.event;

    items: ToolbarWidget.Item[] = [];

    @postConstruct()
    protected init() {
        this.toDispose.push(this.commands.onDidExecuteCommand(e => {
            if (this.items.some(item => item.commandId === e.commandId))
                this.update();
        }));
    }

    protected render(): React.ReactNode {
        return <ToolBar
            layout="horizontal"
            styles={{
                padding: "var(--theia-ui-padding)"
            }}
            onMouseDown={e => this.handleToolbarMouseDown(e)}
        >
            {this.items.filter(item => !item.visible || item.visible()).map((item, i) => {
                if (item.separator !== undefined && item.separator)
                    return <ToolBarItemSeparator key={i} />;

                let command: Command | undefined;
                if (item.commandId)
                    command = this.commands.getCommand(item.commandId);

                let iconClass = item.iconClass;

                if (!iconClass && command && command.iconClass)
                    iconClass = command.iconClass.replace("martini-icon ", "");

                let tooltip = item.tooltip;

                if (!tooltip && command && command.label)
                    tooltip = command.label;

                if (command) {
                    const keybindings = this.keybindings.getKeybindingsForCommand(command.id);
                    if (keybindings && keybindings.length >= 1) {
                        const keybinding = keybindings[0];
                        const accelerator = PhosphorCommandRegistry.formatKeystroke(this.keybindings.acceleratorFor(keybinding)[0]);
                        if (tooltip)
                            tooltip += " (" + accelerator + ")";
                        else
                            tooltip = " (" + accelerator + ")";
                    }
                }

                let enabled = item.enabled;

                if (enabled === undefined && command)
                    enabled = this.commands.isEnabled(command.id, ...this.getCommandArgs(command.id));

                let toggled = item.toggled;

                if (toggled === undefined && command)
                    toggled = this.commands.isToggled(command.id, ...this.getCommandArgs(command.id));

                return <ToolBarItem
                    key={i}
                    iconClass={iconClass}
                    disabledIconClass={item.disabledIconClass}
                    enabled={enabled}
                    toggled={toggled}
                    label={item.label}
                    tooltip={tooltip}
                    onClick={e => this.handleClick(e, item)}
                />;
            })}
        </ToolBar>;
    }

    protected handleToolbarMouseDown(e: React.MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this.onMouseDownEmitter.fire(e);
    }

    protected handleClick(e: React.MouseEvent, item: ToolbarWidget.Item): void {
        if (item.menuPath) {
            const { left, bottom } = e.currentTarget.getBoundingClientRect();
            this.menuRenderer.render({
                anchor: {
                    x: left,
                    y: bottom
                },
                args: this.getCommandArgs(),
                menuPath: item.menuPath
            });
        }
        else if (item.commandId)
            this.commands.executeCommand(item.commandId, ...this.getCommandArgs(item.commandId));
        else if (item.onClick)
            item.onClick(e);
    }

    protected getCommandArgs(commandId?: string): any[] {
        return [];
    }

}

export namespace ToolbarWidget {
    export interface Item extends ToolbarItemProps {
        commandId?: string;
        separator?: boolean;
        menuPath?: MenuPath;
        visible?: () => boolean;
    }
}
