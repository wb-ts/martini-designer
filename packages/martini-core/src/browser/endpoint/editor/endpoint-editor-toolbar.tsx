import { CommandRegistry } from "@phosphor/commands";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { EndpointType, getDisplayName } from "../../../common/endpoint/martini-endpoint-manager";
import { Icon, OverlayIcon } from "../../components/icon-overlay";
import { ToolBar, ToolBarItem } from "../../components/toolbar";
import { errorsToString, FormError } from "../../form/form";

interface EndpointEditorToolbarProps {
    onStart?: () => void;
    onStop?: () => void;
    onTest?: () => void;
    onSearch?: () => void;
    onRevert?: () => void;
    endpointName: string;
    endpointType: EndpointType;
    errors: FormError[],
    status: "STOPPED" | "STARTED";
}

const EndpointEditorToolbarStyles = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr max-content;
    padding: 14px;

    .title-wrapper {
        text-overflow: ellipsis;
        overflow: hidden;
        display: grid;
    }

    .title {
        padding-left: var(--theia-ui-padding);
        font-size: large;
        white-space: pre;
        min-width: 0;
        text-overflow: ellipsis;
        overflow: hidden;
        align-self: center;
    }

    .error-label {
        font-size: unset;
    }
`;

export const EndpointEditorToolbar: React.FC<EndpointEditorToolbarProps> = ({
    onStart,
    onStop,
    onTest,
    onSearch,
    onRevert,
    endpointName: connectionName,
    endpointType,
    status,
    errors
}) => {
    let title = <div className="title-wrapper">
        <div className="title">{getDisplayName(endpointType)} Connection - {connectionName}</div>
    </div>;
    if (errors.length !== 0) {
        const tooltip = errorsToString(errors);
        title = <div className="title-wrapper">
            <div
                className="title error-label"
                title={tooltip}
            >
                {errors[0].label}: {errors[0].message}
            </div>
        </div>;
    }

    return <EndpointEditorToolbarStyles>
        <Icon iconClass={errors.length === 0 ? `martini-${endpointType}-endpoint-icon` : "martini-error-icon"}>
            <OverlayIcon
                iconClass={status === "STOPPED" ? "martini-stopped-overlay-icon" : "martini-started-overlay-icon"}
                position="top-right"
                width={7}
            />
        </Icon>
        {title}
        <ToolBar layout="horizontal">
            <button
                className="theia-button"
                onClick={onTest}
                disabled={errors.length !== 0}
            >
                {messages.test_configuration}
            </button>
            <button className="theia-button" onClick={onRevert}>{messages.revert}</button>
            <ToolBarItem
                iconClass="martini-search-icon"
                tooltip={`Find (${CommandRegistry.formatKeystroke("Accel F")})`}
                onClick={onSearch}
            />
            <ToolBarItem
                iconClass="martini-start-icon"
                onClick={onStart}
                disabledIconClass="martini-start-icon disabled-icon"
                enabled={status === "STOPPED" && !!onStart}
            />
            <ToolBarItem
                iconClass="martini-stop-icon"
                onClick={onStop}
                disabledIconClass="martini-stop-icon disabled-icon"
                enabled={status === "STARTED" && !!onStop}
            />
        </ToolBar>
    </EndpointEditorToolbarStyles>;
};
