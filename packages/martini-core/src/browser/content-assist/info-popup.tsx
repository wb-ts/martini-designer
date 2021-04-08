import * as React from "react";
import styled from "styled-components";
import { ContentProposal } from "./content-assist";

export interface InfoPopupProps {
    proposal: ContentProposal;
}

const Styles = styled.div`
    background-color: var(--theia-editorWidget-background);
    border: 1px solid var(--theia-contrastBorder);
    box-shadow: 0 0px 8px var(--theia-widget-shadow);
    padding: var(--theia-ui-padding);
    font-size: 12px;
    overflow: auto;
`;

export const InfoPopup: React.FC<InfoPopupProps> = ({ proposal }) => {
    return <Styles tabIndex={-1}>
        {proposal.information}
    </Styles>;
};
