import { CommandHandler } from "@theia/core";
import { PreferenceScope, PreferenceService, Widget } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import { Navigator } from "../navigator/martini-navigator-view-widget";

@injectable()
export class ToggleHideFileExtensionHandler implements CommandHandler {
    @inject(PreferenceService)
    private readonly prefService: PreferenceService;

    execute() {
        this.prefService.set(
            "navigator.hideFileExtensions",
            !this.prefService.get("navigator.hideFileExtensions"),
            PreferenceScope.User
        );
    }

    isToggled() {
        return !!this.prefService.get<boolean>("navigator.hideFileExtensions");
    }

    isVisible(...args: any[]) {
        return args[0] instanceof Widget && args[0].id === Navigator.ID;
    }
}
