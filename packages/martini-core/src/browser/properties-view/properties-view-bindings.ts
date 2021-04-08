import { bindViewContribution, WidgetFactory } from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import { PropertiesViewContribution } from "./properties-view-contribution";
import { PropertiesViewWidget } from "./properties-view-widget";
import { TabbedPropertiesViewPage } from "./tabbed-properties-view-page";

export const bindPropertiesViewBindings = (bind: interfaces.Bind) => {
    bindViewContribution(bind, PropertiesViewContribution);
    bind(PropertiesViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PropertiesViewWidget.ID,
        createWidget: () => ctx.container.get<PropertiesViewWidget>(PropertiesViewWidget)
    }));
    bind(TabbedPropertiesViewPage)
        .toSelf()
        .inRequestScope();
};
