import { Command } from "@theia/core";
import { AbstractViewContribution, bindViewContribution, ReactWidget, WidgetFactory } from "@theia/core/lib/browser";
import { injectable, interfaces } from "inversify";
import * as React from "react";
import styled from "styled-components";

const ViewStyles = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

@injectable()
export class MarketplaceView extends ReactWidget {
    static ID = "marketplace-view";
    static NAME = "Marketplace";

    constructor() {
        super();
        this.id = MarketplaceView.ID;
        this.title.label = MarketplaceView.NAME;
        this.title.iconClass = "martini-tab-icon martini-marketplace-icon";
        this.title.closable = true;
        this.update();
    }

    protected render(): React.ReactNode {
        return <ViewStyles>
            <h1>Marketplace</h1>
        </ViewStyles>;
    }
}

export const ToggleMarketplaceViewCommand: Command = {
    id: "marketplace.toggleMarketplaceView",
    iconClass: "martini-icon martini-marketplace-icon"
};

@injectable()
export class MarketplaceWidgetContribution extends AbstractViewContribution<MarketplaceView> {
    constructor() {
        super({
            widgetId: MarketplaceView.ID,
            widgetName: MarketplaceView.NAME,
            toggleCommandId: ToggleMarketplaceViewCommand.id,
            defaultWidgetOptions: {
                area: "main"
            }
        });
    }
}

export const bindMarketplaceView = (bind: interfaces.Bind) => {
    bind(MarketplaceView).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: MarketplaceView.ID,
        createWidget: () => context.container.get(MarketplaceView)
    }));
    bindViewContribution(bind, MarketplaceWidgetContribution);
};
