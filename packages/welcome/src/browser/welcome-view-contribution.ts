import { Command, CommandRegistry, CommandService, MenuModelRegistry } from "@theia/core";
import { AbstractViewContribution, CommonMenus, LocalStorageService } from "@theia/core/lib/browser";
import { FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { WelcomeWidget } from "./welcome-widget";

export const ShowWelcomeViewCommand: Command = {
    id: "welcome.show",
    label: messages.welcome
};

@injectable()
export class WelcomeViewContribution extends AbstractViewContribution<WelcomeWidget> {
    constructor(
        @inject(FrontendApplicationStateService)
        appState: FrontendApplicationStateService,
        @inject(CommandService)
        private readonly commandService: CommandService,
        @inject(LocalStorageService)
        private readonly storage: LocalStorageService
    ) {
        super({
            widgetId: WelcomeWidget.ID,
            widgetName: messages.welcome,
            defaultWidgetOptions: {
                area: "main"
            }
        });
        appState.onStateChanged(state => {
            if (state === "initialized_layout") this.showWelcome();
        });
    }

    async showWelcome() {
        const show = await this.storage.getData(WelcomeWidget.KEY_SHOW);
        if (show) this.commandService.executeCommand(ShowWelcomeViewCommand.id);
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ShowWelcomeViewCommand, {
            execute: () => super.openView({ activate: false, reveal: true }),
            isVisible: () => false
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: ShowWelcomeViewCommand.id
        });
    }
}
