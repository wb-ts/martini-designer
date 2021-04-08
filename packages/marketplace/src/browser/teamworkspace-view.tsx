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

export class TeamWorkspaceView extends ReactWidget {
    static ID = "teamworkspace-view";
    static NAME = "Team Workspace";

    constructor() {
        super();
        this.id = TeamWorkspaceView.ID;
        this.title.label = TeamWorkspaceView.NAME;
        this.title.iconClass = "martini-tab-icon martini-team-workspace-icon";
        this.title.closable = true;
        this.update();
    }

    protected render(): React.ReactNode {
        return <ViewStyles>
            <h1>Team Workspace</h1>
        </ViewStyles>;
    }
}

export const ToggleTeamWorkspaceViewCommand: Command = {
    id: "marketplace.toggleTeamWorkspaceView",
    iconClass: "martini-icon martini-team-workspace-icon"
};

@injectable()
export class TeamWorkspaceViewContribution extends AbstractViewContribution<TeamWorkspaceView> {
    constructor() {
        super({
            widgetId: TeamWorkspaceView.ID,
            widgetName: TeamWorkspaceView.NAME,
            toggleCommandId: ToggleTeamWorkspaceViewCommand.id,
            defaultWidgetOptions: {
                area: "main"
            }
        });
    }
}

export const bindTeamWorkspaceView = (bind: interfaces.Bind) => {
    bind(TeamWorkspaceView).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: TeamWorkspaceView.ID,
        createWidget: () => context.container.get(TeamWorkspaceView)
    }));
    bindViewContribution(bind, TeamWorkspaceViewContribution);
};
