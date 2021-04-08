import { bindViewContribution, WidgetFactory } from "@theia/core/lib/browser";
import { ContainerModule } from "inversify";
import "../../src/browser/index.css";
import { WelcomeDataProvider, WelcomeDataProviderImpl } from "./welcome-data-provider";
import { WelcomeViewContribution } from "./welcome-view-contribution";
import { WelcomeWidget } from "./welcome-widget";

export default new ContainerModule(bind => {
    bindViewContribution(bind, WelcomeViewContribution);
    bind(WelcomeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: WelcomeWidget.ID,
        createWidget: () => context.container.get(WelcomeWidget)
    }));
    bind(WelcomeDataProvider).to(WelcomeDataProviderImpl).inSingletonScope;
});
