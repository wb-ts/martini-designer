import {interfaces} from "inversify";
import {MartiniPackageEventDispatcher, MartiniPackageEventDispatcherClient} from "./martini-package-event-dispatcher";
import {MartiniPackageManager, martiniPackageManagerPath} from "../../common/package/martini-package-manager";
import {WebSocketConnectionProvider} from "@theia/core/lib/browser";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution
} from "../navigator/martini-navigator-view-widget";
import {PackageNavigatorContentProvider, PackageNavigatorLabelProvider} from "./package-navigator-contribution";
import {CommandContribution, MenuContribution} from "@theia/core";
import {MartiniPackageCommandContribution, MartiniPackageMenuContribution} from "./martini-package-contribution";
import {WizardContribution} from "../wizard/wizard-contribution";
import {MartiniPackageWizard, MartiniPackageWizardContribution} from "./wizard/martini-package-wizard";

export const bindMartiniPackageBindings = (bind: interfaces.Bind) => {
    bind(MartiniPackageEventDispatcherClient)
        .toSelf()
        .inSingletonScope();
    bind(MartiniPackageEventDispatcher).toService(
        MartiniPackageEventDispatcherClient
    );
    bind(MartiniPackageManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy<MartiniPackageManager>(
                martiniPackageManagerPath,
                ctx.container.get(MartiniPackageEventDispatcherClient)
            );
        })
        .inSingletonScope();
    bind(CommandContribution).to(MartiniPackageCommandContribution);
    bind(MenuContribution).to(MartiniPackageMenuContribution);
    bind(PackageNavigatorContentProvider).toSelf();
    bind(NavigatorContentProviderContribution).toService(
        PackageNavigatorContentProvider
    );
    bind(PackageNavigatorLabelProvider).toSelf();
    bind(NavigatorLabelProviderContribution).toService(PackageNavigatorLabelProvider);
    bind(WizardContribution).to(MartiniPackageWizardContribution);
    bind(MartiniPackageWizard).toSelf();
    bind<interfaces.Factory<MartiniPackageWizard>>("Factory<MartiniPackageWizard>")
        .toFactory(ctx => () => ctx.container.get(MartiniPackageWizard));
};
