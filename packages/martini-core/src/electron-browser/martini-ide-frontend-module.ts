import {ContextMenuRenderer} from "@theia/core/lib/browser";
import {BrowserContextMenuRenderer} from "@theia/core/lib/browser/menu/browser-context-menu-renderer";
import {BrowserMainMenuFactory} from "@theia/core/lib/browser/menu/browser-menu-plugin";
import {ContainerModule} from "inversify";
import {configureModule} from "../browser/martini-ide-frontend-module";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    configureModule(bind, unbind, isBound, rebind);
    bind(BrowserMainMenuFactory).toSelf();
    rebind(ContextMenuRenderer)
    .to(BrowserContextMenuRenderer)
    .inSingletonScope();
});
