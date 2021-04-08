/**
 * Generated using theia-extension-generator
 */

import { ThemeService } from "@theia/core/lib/browser/theming";
import { ContainerModule } from "inversify";
import { MartiniDarkTheme } from "./dark";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    ThemeService.get().register(MartiniDarkTheme.dark);
});
