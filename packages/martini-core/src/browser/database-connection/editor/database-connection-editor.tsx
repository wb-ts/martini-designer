import { Disposable, Emitter, MessageService } from "@theia/core";
import { Message, ReactWidget, Saveable, Widget, WidgetOpenerOptions, WidgetOpenHandler } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { Event } from "@theia/core/src/common";
import { FormikErrors } from "formik";
import { inject, injectable, postConstruct } from "inversify";
import { cloneDeep, isEqualWith } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { CassandraDatabaseConnection, DatabaseConnection, DatabaseConnectionEvent, DatabaseType, JdbcDatabaseConnection, MartiniDatabaseConnectionManager, MongoDbDatabaseConnection, RedisDatabaseConnection } from "../../../common/database-connection/martini-database-connection-manager";
import { Loader } from "../../components/loader";
import { ConfirmDialog, createListMessage } from "../../dialogs/dialogs";
import { EditorFlag } from "../../editor/editor-flag";
import { convertFormikErrors, errorsToString, FormError } from "../../form/form";
import { FormSearchBox } from "../../form/form-search-box";
import { NavigatorOpenHandler } from "../../navigator/martini-navigator-view-widget";
import { ProgressService } from "../../progress/progress-service";
import { DatabaseConnectionEventDispatcher } from "../database-connection-event-dispatcher";
import createDefaultCassandraDatabaseConnection from "./cassandra/cassandra-connection-default";
import { CassandraConnectionForm } from "./cassandra/cassandra-connection-form";
import { DatabaseConnectionEditorToolbar } from "./database-connection-editor-toolbar";
import createDefaultJdbcDatabaseConnection from "./jdbc/jdbc-connection-default";
import { JdbcConnectionForm } from "./jdbc/jdbc-connection-form";
import createDefaultMongodbDatabaseConnection from "./mongodb/mongodb-connection-default";
import { MongoDbConnectionForm } from "./mongodb/mongodb-connection-form";
import createDefaultRedisDatabaseConnection from "./redis/redis-connection-default";
import { RedisConnectionForm } from "./redis/redis-connection-form";

export const DatabaseConnectionEditorOptions = Symbol("DatabaseConnectionEditorOptions");
export interface DatabaseConnectionEditorOptions {
    uri: string;
    databaseType: DatabaseType;
    name: string;
    isNew: boolean;
}

const DatabaseConnectionEditorStyles = styled.div`
    display: grid;
    grid-template-rows: max-content 1fr;
    height: 100%;

    .content {
        padding: var(--theia-ui-padding);
        overflow-y: auto;
    }
`;

@injectable()
export class DatabaseConnectionEditor extends ReactWidget implements Saveable {
    static readonly FACTORY_ID = "database-connection-editor";
    static readonly URI_SCHEME = "db-connection";

    @inject(DatabaseConnectionEditorOptions)
    private readonly options: DatabaseConnectionEditorOptions;
    @inject(MartiniDatabaseConnectionManager)
    private readonly databaseConnectionManager: MartiniDatabaseConnectionManager;
    @inject(DatabaseConnectionEventDispatcher)
    private readonly databaseConnectionEventDispatcher: DatabaseConnectionEventDispatcher;
    @inject(ProgressService)
    private readonly progressService: ProgressService;
    @inject(MessageService)
    private readonly messageService: MessageService;

    private currentConnection: DatabaseConnection;
    private initialConnection: DatabaseConnection;

    private _dirty: boolean = false;
    readonly autoSave: "off";
    private readonly onDirtyChangedEmitter = new Emitter<void>();
    readonly onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;
    private searchBox: FormSearchBox;
    private errors: FormError[] = [];
    private reset = false;

    @postConstruct()
    async init() {
        this.id = this.options.uri.toString();
        this.title.label = this.options.name;
        this.updateTitle();
        this.title.closable = true;
        this.node.tabIndex = -1;
        this.scrollOptions = undefined;
        this.searchBox = new FormSearchBox(this.node);
        EditorFlag.flag(this);

        if (!this.options.isNew) {
            this.update();
            this.initialConnection = await this.databaseConnectionManager.get(this.options.name);
        }
        else {
            this.dirty = true;
            this.initialConnection = createDefaultConnection(this.options.name, this.options.databaseType);
        }

        this.currentConnection = cloneDeep(this.initialConnection);

        this.toDispose.push(this.databaseConnectionEventDispatcher.onDatabaseConnectionEvent(this.handleDatabaseConnectionEvent));
        this.update();
    }

    onActivateRequest(msg: Message) {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    onAfterAttach(msg: Message) {
        super.onAfterAttach(msg);

        if (this.searchBox.isAttached)
            Widget.detach(this.searchBox);
        Widget.attach(this.searchBox, this.node);
        this.node.addEventListener('keydown', e => {
            if (e.metaKey && e.key === 'f')
                this.handleSearch();

        });
        this.toDisposeOnDetach.push(Disposable.create(() => Widget.detach(this.searchBox)));
    }

    get dirty() {
        return this._dirty;
    }

    set dirty(dirty: boolean) {
        if (this._dirty !== dirty) {
            this._dirty = dirty;
            this.onDirtyChangedEmitter.fire();
        }
    }

    async save() {
        if (this.errors.length === 0) {
            await this.progressService.showProgress(messages.database_connection_editor_saving, async () => {
                try {
                    let start = false;
                    if (this.currentConnection.status === "STARTED") {
                        start = true;
                        await this.databaseConnectionManager.stop(this.currentConnection.name);
                    }
                    await this.databaseConnectionManager.save(this.currentConnection);
                    this.initialConnection = this.currentConnection;
                    if (this.options.isNew) {
                        this.options.isNew = false;
                        this.update();
                    }
                    this.dirty = false;
                    if (start)
                        await this.databaseConnectionManager.start(this.currentConnection.name);
                } catch (error) {
                    this.messageService.error(error.toString());
                }
            });
        } else {
            const dlg = new ConfirmDialog({
                title: messages.unable_to_save_title,
                showCancel: false,
                msg: createListMessage(
                    messages.unable_to_save,
                    this.errors.map(({ label, message }) => `${label}: ${message}`)
                )
            });
            await dlg.open();
        }
    }

    showSearchBox() {
        this.handleSearch();
    }

    public render(): React.ReactNode {
        if (this.currentConnection) {
            return <DatabaseConnectionEditorStyles tabIndex={-1}>
                <DatabaseConnectionEditorToolbar
                    onStart={this.options.isNew ? undefined : this.handleStart}
                    onStop={this.options.isNew ? undefined : this.handleStop}
                    onTest={this.handleTestConfiguration}
                    onRevert={this.handleRevert}
                    onSearch={this.handleSearch}
                    connectionName={this.options.name}
                    databaseType={this.options.databaseType}
                    status={this.currentConnection.status}
                    errors={this.errors}
                />
                <div className="content">
                    {this.renderForm()}
                </div>
            </DatabaseConnectionEditorStyles>;
        }
        else
            return <Loader message={messages.loading} />;
    }

    private handleChange(connection?: DatabaseConnection) {
        if (connection)
            this.currentConnection = connection;
        this.dirty = this.isDirty();
    }

    private handleErrors(errors: FormikErrors<DatabaseConnection>) {
        this.errors = convertFormikErrors(this.node, errors);
        this.updateTitle();
        this.update();
    }

    private handleDatabaseConnectionEvent = async (event: DatabaseConnectionEvent) => {
        if (event.event === "DELETED") {
            this.close();
            return;
        }

        if (event.event === "STARTED" || event.event === "STOPPED") {
            this.currentConnection.status = event.event;
            this.update();
        } else if (event.event === "SAVED") {
            const updatedConnection = await this.databaseConnectionManager.get(this.options.name);
            if (!this.dirty) {
                this.currentConnection = updatedConnection;
                this.reset = true;
                this.update();
            }
            this.initialConnection = updatedConnection;
        }
    };

    private handleTestConfiguration = async () => {
        this.progressService.showProgress(messages.database_connection_editor_testing, async () => {
            try {
                await this.databaseConnectionManager.test(this.currentConnection);
                this.messageService.info(messages.database_connection_editor_testing_success, {
                    timeout: 2000
                });
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleStart = async () => {
        if (this.currentConnection.status === "STARTED")
            return;
        this.progressService.showProgress(messages.database_connection_editor_starting, async () => {
            try {
                await this.databaseConnectionManager.start(this.options.name);
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleStop = async () => {
        if (this.currentConnection.status === "STOPPED")
            return;
        this.progressService.showProgress(messages.database_connection_editor_stopping, async () => {
            try {
                await this.databaseConnectionManager.stop(this.options.name);
            } catch (error) {
                console.error(error);
                this.messageService.error(error.toString());
            }
        });
    };

    private handleRevert = async () => {
        const dlg = new ConfirmDialog({
            title: messages.revert_all_title,
            msg: messages.revert_all_question,
            ok: messages.revert
        });

        const revert = await dlg.open();
        if (revert) {
            this.currentConnection = this.initialConnection;
            this.reset = true;
            this.handleChange();
            this.update();
        }
    };

    private handleSearch = () => {
        this.searchBox.show();
        this.searchBox.activate();
    };

    private isDirty(): boolean {
        return this.options.isNew || !isEqualWith(this.initialConnection, this.currentConnection, (_value, _other, indexOrKey) => {
            if (indexOrKey === "status")
                return true;
        });
    }

    private renderForm(): React.ReactNode {
        const _reset = this.reset;
        this.reset = false;
        switch (this.options.databaseType) {
            case DatabaseType.JDBC:
                return <JdbcConnectionForm
                    connection={this.currentConnection as JdbcDatabaseConnection}
                    driverProvider={() => this.databaseConnectionManager.getDrivers()}
                    onChange={connection => this.handleChange(connection)}
                    onValidate={errors => this.handleErrors(errors)}
                    reset={_reset}
                />;
            case DatabaseType.CASSANDRA:
                return <CassandraConnectionForm
                    connection={this.currentConnection as CassandraDatabaseConnection}
                    onChange={connection => this.handleChange(connection)}
                    onValidate={errors => this.handleErrors(errors)}
                    reset={_reset}
                />;
            case DatabaseType.MONGODB:
                return <MongoDbConnectionForm
                    connection={this.currentConnection as MongoDbDatabaseConnection}
                    onChange={connection => this.handleChange(connection)}
                    onValidate={errors => this.handleErrors(errors)}
                    reset={_reset}
                />;
            case DatabaseType.REDIS:
                return <RedisConnectionForm
                    connection={this.currentConnection as RedisDatabaseConnection}
                    onChange={connection => this.handleChange(connection)}
                    onValidate={errors => this.handleErrors(errors)}
                    reset={_reset}
                />;
            default:
                return <></>;
        }
    }

    private updateTitle() {
        this.title.label = this.options.name;

        if (this.errors.length === 0) {
            this.title.caption = `Database connection - ${this.options.name}`;
            this.title.iconClass = `martini-tab-icon martini-${this.options.databaseType}-icon`;
        }
        else {
            this.title.iconClass = "martini-tab-icon martini-error-icon";
            this.title.caption = errorsToString(this.errors);
        }
    }
}


@injectable()
export class DatabaseConnectionEditorNavigatorOpenHandler implements NavigatorOpenHandler {

    getUri(element: any): URI {
        return new URI(`${DatabaseConnectionEditor.URI_SCHEME}://${encodeURI(element.name)}?type=${element.type}`);
    }

    canHandle(element: any): boolean {
        return DatabaseConnection.is(element);
    }

}

@injectable()
export class DatabaseConnectionEditorOpenHandler extends WidgetOpenHandler<DatabaseConnectionEditor> {
    readonly id = DatabaseConnectionEditor.FACTORY_ID;

    canHandle(uri: URI, _?: WidgetOpenerOptions): number {
        return uri.scheme === DatabaseConnectionEditor.URI_SCHEME ? 200 : -1;
    }

    protected createWidgetOptions(uri: URI, _?: WidgetOpenerOptions): DatabaseConnectionEditorOptions {
        const params: { [key: string]: string; } = {};
        uri.query.split("&").forEach(param => {
            const [key, value] = param.split("=");
            params[key] = value;
        });
        return {
            uri: uri.withoutFragment().toString(),
            databaseType: DatabaseConnection.getType(params["type"])!,
            name: decodeURI(uri.authority),
            isNew: params["new"] === "true",
        };
    }
}

export const createDefaultConnection = (name: string, type: DatabaseType): DatabaseConnection => {
    switch (type) {
        case DatabaseType.JDBC:
            return createDefaultJdbcDatabaseConnection(name);
        case DatabaseType.CASSANDRA:
            return createDefaultCassandraDatabaseConnection(name);
        case DatabaseType.MONGODB:
            return createDefaultMongodbDatabaseConnection(name);
        case DatabaseType.REDIS:
            return createDefaultRedisDatabaseConnection(name);
        default:
            return {
                name: name,
                status: "STOPPED",
                type,
                autoStart: true,
            };
    }
};
