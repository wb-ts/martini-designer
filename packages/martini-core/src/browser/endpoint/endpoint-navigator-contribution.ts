import {inject, injectable, postConstruct} from "inversify";
import * as React from "react";
import {MartiniEndpoint, MartiniEndpointManager} from "../../common/endpoint/martini-endpoint-manager";
import {PartialMartiniPackage} from "../../common/package/martini-package-manager";
import {
    NavigatorContentProviderContribution,
    NavigatorLabelProviderContribution
} from "../navigator/martini-navigator-view-widget";
import {AbstractTreeContentProvider, AbstractTreeLabelProvider, OverlayIcon, UpdateDataEvent} from "../tree/base-tree";
import {EndpointEventDispatcher} from "./endpoint-event-dispatcher";

@injectable()
export class EndpointNavigatorContentProvider
    extends AbstractTreeContentProvider
    implements NavigatorContentProviderContribution {
    @inject(MartiniEndpointManager)
    private endpointManager: MartiniEndpointManager;
    @inject(EndpointEventDispatcher)
    private endpointEventDispatcher: EndpointEventDispatcher;
    priority = 1;

    @postConstruct()
    init() {
        this.toDispose.push(this.endpointEventDispatcher.onEndpointEvent(async e => {
            if (e.event !== "DELETED" && e.event !== "SAVED") {
                const updated = (await this.endpointManager.getAll(e.packageName)).find(
                    endpoint =>
                        endpoint.name === e.name && endpoint.packageName === e.packageName
                );

                if (updated) {
                    this.onDidUpdateEmitter.fire({
                        affects: element =>
                            MartiniEndpoint.is(element) &&
                            element.name === e.name &&
                            element.packageName === e.packageName,
                        update: _ => updated
                    } as UpdateDataEvent);
                }
            } else {
                this.onDidUpdateEmitter.fire(
                    (element: any) =>
                        PartialMartiniPackage.is(element) && element.name === e.packageName
                );
            }
        }));
    }

    canHandle(element: any): boolean {
        return (
            PartialMartiniPackage.is(element) || EndpointListTreeNode.is(element)
        );
    }

    async resolveChildren(parent: any): Promise<any[]> {
        if (PartialMartiniPackage.is(parent) && parent.status !== "UNLOADED")
            return [
                {
                    type: "endpoint-list-node",
                    martiniPackage: parent
                } as EndpointListTreeNode
            ];

        if (EndpointListTreeNode.is(parent)) {
            if (parent.martiniPackage.status === "UNLOADED") return [];
            const endpoints = await this.endpointManager.getAll(
                parent.martiniPackage.name
            );
            return endpoints;
        }

        return [];
    }

    hasChildren(parent: any): boolean {
        return EndpointListTreeNode.is(parent);
    }

    getParent(element: any) {
        if (EndpointListTreeNode.is(element)) return element.martiniPackage;
    }
}

export class EndpointNavigatorLabelProvider extends AbstractTreeLabelProvider
    implements NavigatorLabelProviderContribution {
    priority: 0;

    canHandle(element: any): boolean {
        return EndpointListTreeNode.is(element) || MartiniEndpoint.is(element);
    }

    getCaption(element: any): string | React.ReactNode[] | undefined {
        if (EndpointListTreeNode.is(element)) return "Endpoints";
        if (MartiniEndpoint.is(element)) return element.name;
    }

    getIconClass(element: any): string | undefined {
        if (EndpointListTreeNode.is(element))
            return `martini-tree-icon martini-endpoint-icon`;
        if (MartiniEndpoint.is(element))
            return `martini-tree-icon martini-${element.type}-endpoint-icon`;
    }

    getOverlayIcons(element: any): OverlayIcon[] | undefined {
        if (MartiniEndpoint.is(element)) {
            const endpoint = element;
            if (endpoint.status === "STARTED")
                return [
                    {
                        width: 7,
                        height: 8,
                        iconClass: "martini-started-overlay-icon",
                        position: "top-right"
                    }
                ];
            if (endpoint.status === "STOPPED")
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

export interface EndpointListTreeNode {
    type: "endpoint-list-node";
    martiniPackage: PartialMartiniPackage;
}

export namespace EndpointListTreeNode {
    export function is(object: any): object is EndpointListTreeNode {
        return (
            !!object &&
            object.type === "endpoint-list-node" &&
            "martiniPackage" in object
        );
    }
}
