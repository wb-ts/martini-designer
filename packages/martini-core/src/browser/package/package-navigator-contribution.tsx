import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";
import { MartiniPackageManager, PartialMartiniPackage } from "../../common/package/martini-package-manager";
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
import { MartiniPackageEventDispatcher } from "./martini-package-event-dispatcher";

@injectable()
export class PackageNavigatorContentProvider extends AbstractTreeContentProvider
    implements NavigatorContentProviderContribution {
    @inject(MartiniPackageManager) private packageManager: MartiniPackageManager;
    @inject(MartiniPackageEventDispatcher)
    private packageEventDispatcher: MartiniPackageEventDispatcher;

    readonly priority = 0;

    @postConstruct()
    init() {
        this.toDispose.push(this.packageEventDispatcher.onPackageEvent(async e => {
            if (e.event !== "DELETED" && e.event !== "ADD") {
                const updated = (await this.packageManager.getAll()).find(
                    p => p.name === e.packageName
                );

                if (updated) {
                    this.onDidUpdateEmitter.fire({
                        affects: element =>
                            PartialMartiniPackage.is(element) &&
                            element.name === e.packageName,
                        update: _ => updated
                    } as UpdateDataEvent);
                }
            } else {
                this.onDidUpdateEmitter.fire(
                    ((element: any) =>
                        element instanceof NavigatorRoot) as RefreshContentEvent
                );
            }
        }));
    }

    canHandle(element: any): boolean {
        return element instanceof NavigatorRoot;
    }

    async resolveChildren(parent: any): Promise<any[]> {
        if (parent instanceof NavigatorRoot)
            return (await this.packageManager.getAll()).sort((p1, p2) => {
                if (p1.name === "core")
                    return -1;
                if (p2.name === "core")
                    return 1;
                return p1.name.localeCompare(p2.name);
            });

        return [];
    }

    hasChildren(parent: any): boolean {
        if (PartialMartiniPackage.is(parent)) return parent.status !== "UNLOADED";
        return false;
    }

    getParent(element: any) {
        // no-op
    }
}

@injectable()
export class PackageNavigatorLabelProvider extends AbstractTreeLabelProvider
    implements NavigatorLabelProviderContribution {
    priority = 0;

    getCaption(element: any): string | React.ReactNode[] | undefined {
        if (PartialMartiniPackage.is(element)) {
            if (element.status === "UNLOADED")
                return [
                    <span key="name">{element.name}</span>,
                    <span key="status" style={{ marginLeft: "4px", color: "#888" }}>
                        (Unloaded)
          </span>
                ];
            return element.name;
        }
    }

    canHandle(element: any): boolean {
        return PartialMartiniPackage.is(element);
    }

    getIconClass(element: any): string | undefined {
        if (PartialMartiniPackage.is(element)) {
            const iconClass = "martini-tree-icon martini-package-icon";
            if (element.status === "UNLOADING" || element.status === "LOADING") {
                return iconClass + " loading-package";
            }
            return iconClass;
        }
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        if (PartialMartiniPackage.is(element)) {
            if (element.status === "STARTED")
                return [
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-started-overlay-icon",
                        position: "top-right"
                    }
                ];
            if (element.status === "START_FAILED")
                return [
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-stopped-overlay-icon",
                        position: "top-right"
                    },
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-error-overlay-icon",
                        position: "top-left"
                    }
                ];
            if (element.status === "LOADED" || element.status === "UNLOADED")
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
}
