import { CommandContribution, ILogger, LogLevel, MenuContribution } from "@theia/core";
import {
    FrontendApplicationContribution,
    KeybindingContribution,
    WebSocketConnectionProvider
} from "@theia/core/lib/browser";
import { ContainerModule, inject, injectable, interfaces } from "inversify";
import "../../src/browser/style/index.css";
import { MartiniAccountManager, martiniAccountManagerPath } from "../common/instance/martini-account-manager";
import {
    MartiniInstanceInfoManager,
    martiniInstanceInfoManagerPath
} from "../common/instance/martini-instance-info-manager";
import { ResourceSearchService, resourceSearchServicePath } from "../common/search/resource-search-service";
import { ServiceSearchService, serviceSearchServicePath } from "../common/search/service-search-service";
import { DocumentTypeManager, documentTypeManagerPath } from "../common/tracker/document-type-manager";
import { ContentAssistContributionManager } from "./content-assist/content-assist-contribution";
import { bindDatabaseConnectionBindings } from "./database-connection/database-connection-bindings";
import { ApiResponseHandler } from "./dialogs/api-response-handler";
import { LocalDnDTransfer } from "./dnd/local-dnd-transfer";
import { bindEmbeddedTextEditor } from "./editor/embedded-text-editor";
import { bindMarkdownEditorDialog } from "./editor/md/markdown-editor";
import { bindEndpointBindings } from "./endpoint/endpoint-bindings";
import { bindFilesystemBindings } from "./fs/filesystem-bindings";
import { bindJmsBindings } from "./jms/jms-bindings";
import {
    MartiniIdeCommandContribution,
    MartiniIdeKeybindingContribution,
    MartiniMenuContribution
} from "./martini-ide-contribution";
import { bindNavigatorBindings } from "./navigator/navigator-bindings";
import { bindMartiniPackageBindings } from "./package/martini-package-bindings";
import { DefaultProgressService, ProgressService } from "./progress/progress-service";
import { bindPropertiesViewBindings } from "./properties-view/properties-view-bindings";
import { bindResourceSearchBindings } from "./search/resource-search-bindings";
import { bindWizardBindings } from "./wizard/wizard-bindings";
import { initYupExt } from "./yup/yup-ext";
import { initYupLocale } from "./yup/yup-locale";

export const configureModule: interfaces.ContainerModuleCallBack = (bind, unbind, isBound, rebind) => {
    bindPropertiesViewBindings(bind);
    bindNavigatorBindings(bind);
    bindMartiniPackageBindings(bind);
    bindEndpointBindings(bind);
    bindDatabaseConnectionBindings(bind);
    bindFilesystemBindings(bind);
    bindWizardBindings(bind);
    bindEmbeddedTextEditor(bind, rebind);
    bindMarkdownEditorDialog(bind);
    bindJmsBindings(bind);
    bind(MenuContribution)
        .to(MartiniMenuContribution)
        .inSingletonScope();
    bind(CommandContribution)
        .to(MartiniIdeCommandContribution)
        .inSingletonScope();
    bind(KeybindingContribution)
        .to(MartiniIdeKeybindingContribution)
        .inSingletonScope();
    bind(FrontendApplicationContribution).to(MartiniIdeFrontendContribution);
    bind(ProgressService)
        .to(DefaultProgressService)
        .inSingletonScope();
    bind(MartiniInstanceInfoManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy<MartiniInstanceInfoManager>(martiniInstanceInfoManagerPath);
        })
        .inSingletonScope();
    bind(MartiniAccountManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy<MartiniAccountManager>(martiniAccountManagerPath);
        })
        .inSingletonScope();
    bind(DocumentTypeManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(documentTypeManagerPath);
        })
        .inSingletonScope();
    bind(ResourceSearchService)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(resourceSearchServicePath);
        })
        .inSingletonScope();
    bind(ServiceSearchService)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(serviceSearchServicePath);
        })
        .inSingletonScope();
    bind(ApiResponseHandler)
        .toSelf()
        .inSingletonScope();
    bind(LocalDnDTransfer).toConstantValue(LocalDnDTransfer.INSTANCE);
    bindResourceSearchBindings(bind);
    bind(ContentAssistContributionManager)
        .toSelf()
        .inSingletonScope();
};

export default new ContainerModule(configureModule);

@injectable()
export class MartiniIdeFrontendContribution implements FrontendApplicationContribution {
    @inject(MartiniInstanceInfoManager)
    instanceInfoManager: MartiniInstanceInfoManager;
    @inject(MartiniAccountManager)
    accountManager: MartiniAccountManager;
    @inject(ILogger)
    private readonly logger: ILogger;

    initialize() {
        this.logger.setLogLevel(LogLevel.INFO);
        initYupExt();
        initYupLocale();
    }
}
