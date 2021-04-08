import { CommandContribution, MenuContribution } from "@theia/core";
import { OpenHandler, WebSocketConnectionProvider, WidgetFactory } from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import {
    MartiniDatabaseConnectionManager,
    martiniDatabaseConnectionManagerPath
} from "../../common/database-connection/martini-database-connection-manager";
import {
    MartiniMongoDbManager,
    martiniMongoDbManagerPath
} from "../../common/database-connection/mongodb/martini-mongodb-manager";
import {
    MartiniDatabaseSchemaProvider,
    martiniDatabaseSchemaProviderPath
} from "../../common/database-connection/schema/martini-database-schema-provider";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution,
    NavigatorOpenHandler
} from "../navigator/martini-navigator-view-widget";
import { WizardContribution } from "../wizard/wizard-contribution";
import {
    DatabaseConnectionCommandContribution,
    DatabaseConnectionMenuContribution
} from "./database-connection-contribution";
import {
    DatabaseConnectionEventDispatcher,
    DatabaseConnectionEventDispatcherClient
} from "./database-connection-event-dispatcher";
import {
    DatabaseConnectionNavigatorContentProvider,
    DatabaseConnectionNavigatorLabelProvider
} from "./database-connection-navigator-contribution";
import {
    DatabaseConnectionEditor,
    DatabaseConnectionEditorNavigatorOpenHandler,
    DatabaseConnectionEditorOpenHandler,
    DatabaseConnectionEditorOptions
} from "./editor/database-connection-editor";
import {
    DatabaseConnectionWizard,
    DatabaseConnectionWizardContribution,
    DatabaseConnectionWizardPage
} from "./wizard/database-connection-wizard";

export const bindDatabaseConnectionBindings = (bind: interfaces.Bind) => {
    bind(DatabaseConnectionEventDispatcherClient)
        .toSelf()
        .inSingletonScope();
    bind(DatabaseConnectionEventDispatcher).toService(DatabaseConnectionEventDispatcherClient);
    bind(MartiniDatabaseConnectionManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(
                martiniDatabaseConnectionManagerPath,
                ctx.container.get(DatabaseConnectionEventDispatcherClient)
            );
        })
        .inSingletonScope();
    bind(MartiniDatabaseSchemaProvider)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(martiniDatabaseSchemaProviderPath);
        })
        .inSingletonScope();
    bind(MartiniMongoDbManager).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy(martiniMongoDbManagerPath);
    });
    bind(NavigatorContentProviderContribution).to(DatabaseConnectionNavigatorContentProvider);
    bind(NavigatorLabelProviderContribution).to(DatabaseConnectionNavigatorLabelProvider);
    bind(CommandContribution)
        .to(DatabaseConnectionCommandContribution)
        .inSingletonScope();
    bind(MenuContribution)
        .to(DatabaseConnectionMenuContribution)
        .inSingletonScope();

    bind(WizardContribution)
        .to(DatabaseConnectionWizardContribution)
        .inSingletonScope();
    bind(DatabaseConnectionWizard).toSelf();
    bind(DatabaseConnectionWizardPage).toSelf();
    bind("Factory<DatabaseConnectionWizard>").toAutoFactory(DatabaseConnectionWizard);

    bind(WidgetFactory)
        .toDynamicValue(({ container }) => ({
            id: DatabaseConnectionEditor.FACTORY_ID,
            createWidget: (options: DatabaseConnectionEditorOptions) => {
                const child = container.createChild();
                child.bind(DatabaseConnectionEditorOptions).toConstantValue(options);
                child.bind(DatabaseConnectionEditor).toSelf();
                return child.get(DatabaseConnectionEditor);
            }
        }))
        .inSingletonScope();

    bind(OpenHandler)
        .to(DatabaseConnectionEditorOpenHandler)
        .inSingletonScope();
    bind(NavigatorOpenHandler)
        .to(DatabaseConnectionEditorNavigatorOpenHandler)
        .inSingletonScope();
};
