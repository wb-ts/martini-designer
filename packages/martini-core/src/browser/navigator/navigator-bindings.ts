import { bindContributionProvider } from "@theia/core";
import { bindViewContribution, defaultTreeProps, WidgetFactory } from "@theia/core/lib/browser";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { interfaces } from "inversify";
import createBaseTreeContainer from "../tree/base-tree-container";
import { DnDHandler } from "../tree/base-tree-widget";
import { NavigatorViewContribution, NAVIGATOR_VIEW_CONTEXT_MENU } from "./martini-navigator-view-contribution";
import {
    Navigator,
    NavigatorContentProviderContribution,
    NavigatorDnDHandler,
    NavigatorLabelProviderContribution,
    NavigatorOpenHandler,
    NavigatorTreeContentProvider,
    NavigatorTreeLabelProvider
} from "./martini-navigator-view-widget";

export const bindNavigatorBindings = (bind: interfaces.Bind) => {
    bindContributionProvider(bind, NavigatorContentProviderContribution);
    bindContributionProvider(bind, NavigatorLabelProviderContribution);
    bindContributionProvider(bind, NavigatorOpenHandler);
    bindViewContribution(bind, NavigatorViewContribution);
    bind(TabBarToolbarContribution).toService(NavigatorViewContribution);
    bind(Navigator).toSelf();
    bind(NavigatorTreeLabelProvider).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: Navigator.ID,
        createWidget: () => {
            const child = createBaseTreeContainer(
                ctx.container,
                {
                    contentProvider: NavigatorTreeContentProvider,
                    labelProvider: NavigatorTreeLabelProvider
                },
                {
                    ...defaultTreeProps,
                    multiSelect: true,
                    search: false,
                    contextMenuPath: NAVIGATOR_VIEW_CONTEXT_MENU,
                    globalSelection: true
                }
            );
            child.bind(DnDHandler).to(NavigatorDnDHandler);
            child.bind(Navigator).toSelf();
            return child.get(Navigator);
        }
    }));
};
