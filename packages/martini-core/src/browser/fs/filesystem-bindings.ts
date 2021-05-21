import { CommandContribution, ResourceResolver } from "@theia/core";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { interfaces } from "inversify";
import messages from "martini-messages/lib/messages";
import { MartiniFileSystem, martiniFileSystemPath } from "../../common/fs/martini-filesystem";
import { UrlReader, urlReaderPath } from "../../common/fs/url-reader";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution,
    NavigatorOpenHandler
} from "../navigator/martini-navigator-view-widget";
import { WizardContribution } from "../wizard/wizard-contribution";
import { bindFileBrowserDialog } from "./file-browser/file-browser-dialog";
import { ToggleHideFileExtensionHandler } from "./filesystem-command-handlers";
import {
    MartiniFileSystemCommandContribution,
    MartiniFileSystemTabBarToolbarContribution
} from "./martini-filesystem-contribution";
import {
    MartiniFileEventDispatcher,
    MartiniFileSystemEventDispatcherClient
} from "./martini-filesystem-event-dispatcher";
import { MartiniResourceResolver } from "./martini-resource-resolver";
import {
    FileSystemNavigatorContentProvider,
    FileSystemNavigatorLabelProvider,
    FilesystemNavigatorOpenHandler
} from "./navigator/filesystem-navigator-contribution";
import { bindFsPreferences } from "./pref/filesystem-preferences";
import {
    CodeFileLocationValidator,
    DefaultResourceLocationValidator,
    ResourceLocationValidator
} from "./resource-location-validator";
import { CodeFileNameValidator, DefaultResourceNameValidator, ResourceNameValidator } from "./resource-name-validator";
import {
    CodeFileWizardPage,
    DefaultCodeFileWizard,
    DefaultFileWizard,
    DefaultFileWizardProps,
    FileWizardPage,
    FileWizardPageProps
} from "./wizard/base-file-wizard";
import { CodeDirectoryWizardContribution } from "./wizard/code-directory-wizard";
import { DirectoryWizardContribution } from "./wizard/directory-wizard";
import { FileWizardContribution } from "./wizard/file-wizard";
import { FileWizardHelper } from "./wizard/file-wizard-helper";

export const bindFilesystemBindings = (bind: interfaces.Bind) => {
    bind(MartiniFileSystemEventDispatcherClient)
        .toSelf()
        .inSingletonScope();
    bind(MartiniFileEventDispatcher).toService(MartiniFileSystemEventDispatcherClient);
    bind(MartiniFileSystem)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(
                martiniFileSystemPath,
                ctx.container.get(MartiniFileSystemEventDispatcherClient)
            );
        })
        .inSingletonScope();
    bind(UrlReader)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(urlReaderPath);
        })
        .inSingletonScope();

    bind(ResourceResolver)
        .to(MartiniResourceResolver)
        .inSingletonScope();
    bind(DefaultResourceNameValidator)
        .toSelf()
        .inSingletonScope();
    bind(CodeFileNameValidator)
        .toSelf()
        .inSingletonScope();
    bind(DefaultResourceLocationValidator)
        .toSelf()
        .inSingletonScope();
    bind(CodeFileLocationValidator)
        .toSelf()
        .inSingletonScope();

    bind(FileSystemNavigatorContentProvider).toSelf();
    bind(NavigatorContentProviderContribution).toService(FileSystemNavigatorContentProvider);
    bind(FileSystemNavigatorLabelProvider).toSelf();
    bind(NavigatorLabelProviderContribution).toService(FileSystemNavigatorLabelProvider);
    bind(FilesystemNavigatorOpenHandler).toSelf();
    bind(NavigatorOpenHandler).toService(FilesystemNavigatorOpenHandler);
    bind(FileWizardHelper)
        .toSelf()
        .inSingletonScope();

    bind(CommandContribution)
        .to(MartiniFileSystemCommandContribution)
        .inSingletonScope();
    bind(TabBarToolbarContribution)
        .to(MartiniFileSystemTabBarToolbarContribution)
        .inSingletonScope();

    bind(FileWizardPage).toSelf();
    bind("Factory<FileWizardPage>").toFactory(ctx => (props?: Partial<FileWizardPageProps>) => {
        const child = ctx.container.createChild();
        child.bind(FileWizardPageProps).toConstantValue(props || {});
        return child.get(FileWizardPage);
    });

    bind("Factory<DefaultFileWizard>").toFactory(ctx => (props?: Partial<DefaultFileWizardProps>) => {
        const child = ctx.container.createChild();
        child.bind(ResourceNameValidator).toService(DefaultResourceNameValidator);
        child.bind(ResourceLocationValidator).toService(DefaultResourceLocationValidator);

        if (!props) props = {};
        if (!props.title) props.title = messages.create_file_title;
        child.bind(FileWizardPageProps).toConstantValue(props);
        child.bind(DefaultFileWizardProps).toConstantValue(props);
        child.bind(DefaultFileWizard).toSelf();
        return child.get(DefaultFileWizard);
    });

    bind(CodeFileWizardPage).toSelf();
    bind("Factory<DefaultCodeFileWizard>").toFactory(ctx => (props?: Partial<DefaultFileWizardProps>) => {
        const child = ctx.container.createChild();
        child.bind(ResourceNameValidator).toService(CodeFileNameValidator);
        child.bind(ResourceLocationValidator).toService(CodeFileLocationValidator);
        if (!props) props = {};
        if (!props.title) props.title = messages.create_file_title;
        child.bind(FileWizardPageProps).toConstantValue(props);
        child.bind(DefaultFileWizardProps).toConstantValue(props);
        child.bind(DefaultCodeFileWizard).toSelf();
        return child.get(DefaultCodeFileWizard);
    });

    bindFileBrowserDialog(bind);

    bind(WizardContribution).to(FileWizardContribution);
    bind(WizardContribution).to(DirectoryWizardContribution);
    bind(WizardContribution).to(CodeDirectoryWizardContribution);

    bind(ToggleHideFileExtensionHandler).toSelf();
    bindFsPreferences(bind);
};
