import {inject, injectable, postConstruct} from "inversify";
import * as React from "react";
import {
    DatabaseConnection,
    MartiniDatabaseConnectionManager
} from "../../common/database-connection/martini-database-connection-manager";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution,
    NavigatorRoot
} from "../navigator/martini-navigator-view-widget";
import {
    AbstractTreeContentProvider,
    AbstractTreeLabelProvider,
    OverlayIcon,
    RefreshContentEvent,
    UpdateDataEvent
} from "../tree/base-tree";
import {DatabaseConnectionEventDispatcher} from "./database-connection-event-dispatcher";

@injectable()
export class DatabaseConnectionNavigatorContentProvider
    extends AbstractTreeContentProvider
    implements NavigatorContentProviderContribution {
    @inject(MartiniDatabaseConnectionManager)
    private readonly dbConnectionManager: MartiniDatabaseConnectionManager;
    @inject(DatabaseConnectionEventDispatcher)
    private readonly eventDispatcher: DatabaseConnectionEventDispatcher;

    priority = 1;

    @postConstruct()
    init() {
        this.toDispose.push(this.eventDispatcher.onDatabaseConnectionEvent(async e => {
            if (e.event !== "DELETED" && e.event !== "SAVED") {
                const updated = (await this.dbConnectionManager.getAll()).find(
                    dc => dc.name === e.name
                );

                if (updated) {
                    this.onDidUpdateEmitter.fire({
                        affects: element =>
                            DatabaseConnection.is(element) && element.name == e.name,
                        update: _ => updated
                    } as UpdateDataEvent);
                }
            } else {
                this.onDidUpdateEmitter.fire(
                    ((element: any) => element === "Databases") as RefreshContentEvent
                );
            }
        }));
    }

    canHandle(element: any): boolean {
        return element instanceof NavigatorRoot || element === "Databases";
    }

    async resolveChildren(parent: any): Promise<any[]> {
        if (parent === "Databases") return await this.dbConnectionManager.getAll();

        if (parent instanceof NavigatorRoot) return ["Databases"];

        return [];
    }

    hasChildren(parent: any): boolean {
        return parent === "Databases";
    }

    getParent(element: any) {
    }
}

@injectable()
export class DatabaseConnectionNavigatorLabelProvider
    extends AbstractTreeLabelProvider
    implements NavigatorLabelProviderContribution {
    priority = 0;

    getCaption(element: any): string | React.ReactNode[] | undefined {
        if (element === "Databases") return "Databases";
        if (DatabaseConnection.is(element)) return element.name;
    }

    getIconClass(element: any): string | undefined {
        if (DatabaseConnection.is(element))
            return `martini-tree-icon martini-${element.type}-icon`;
        if (element === "Databases")
            return "martini-tree-icon martini-database-icon";
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        if (DatabaseConnection.is(element)) {
            const connection = element;
            if (connection.status === "STARTED")
                return [
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-started-overlay-icon",
                        position: "top-right"
                    }
                ];
            if (connection.status === "STOPPED")
                return [
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-stopped-overlay-icon",
                        position: "top-right"
                    }
                ];
        }
    }

    canHandle(element: any): boolean {
        return element === "Databases" || DatabaseConnection.is(element);
    }
}
