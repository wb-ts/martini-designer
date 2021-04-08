import { CommandContribution, MenuContribution } from "@theia/core";
import { OpenHandler, WebSocketConnectionProvider, WidgetFactory } from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import { MartiniEndpointManager, martiniEndpointManagerPath } from "../../common/endpoint/martini-endpoint-manager";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution,
    NavigatorOpenHandler
} from "../navigator/martini-navigator-view-widget";
import { WizardContribution } from "../wizard/wizard-contribution";
import {
    EndpointEditor,
    EndpointEditorNavigatorOpenHandler,
    EndpointEditorOpenHandler,
    EndpointEditorOptions
} from "./editor/endpoint-editor";
import { EndpointCommandContribution, EndpointMenuContribution } from "./endpoint-contribution";
import { EndpointEventDispatcher, EndpointEventDispatcherClient } from "./endpoint-event-dispatcher";
import { EndpointNavigatorContentProvider, EndpointNavigatorLabelProvider } from "./endpoint-navigator-contribution";
import { EndpointWizard, EndpointWizardContribution, EndpointWizardPage } from "./wizard/endpoint-wizard";

export const bindEndpointBindings = (bind: interfaces.Bind) => {
    bind(EndpointEventDispatcherClient)
        .toSelf()
        .inSingletonScope();
    bind(EndpointEventDispatcher).toService(EndpointEventDispatcherClient);
    bind(MartiniEndpointManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(martiniEndpointManagerPath, ctx.container.get(EndpointEventDispatcherClient));
        })
        .inSingletonScope();
    bind(CommandContribution).to(EndpointCommandContribution);
    bind(MenuContribution).to(EndpointMenuContribution);
    bind(NavigatorContentProviderContribution).to(EndpointNavigatorContentProvider);
    bind(NavigatorLabelProviderContribution).to(EndpointNavigatorLabelProvider);

    bind(WizardContribution)
        .to(EndpointWizardContribution)
        .inSingletonScope();
    bind(EndpointWizard).toSelf();
    bind(EndpointWizardPage).toSelf();
    bind("Factory<EndpointWizard>").toAutoFactory(EndpointWizard);

    bind(WidgetFactory)
        .toDynamicValue(({ container }) => ({
            id: EndpointEditor.FACTORY_ID,
            createWidget: (options: EndpointEditorOptions) => {
                const child = container.createChild();
                child.bind(EndpointEditorOptions).toConstantValue(options);
                child.bind(EndpointEditor).toSelf();
                return child.get(EndpointEditor);
            }
        }))
        .inSingletonScope();

    bind(OpenHandler)
        .to(EndpointEditorOpenHandler)
        .inSingletonScope();
    bind(NavigatorOpenHandler)
        .to(EndpointEditorNavigatorOpenHandler)
        .inSingletonScope();
};
