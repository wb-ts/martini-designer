import * as React from "react";

export const UpDownLabel: React.FC<{ toolTip: string }> = ({ toolTip }) => (
    <div
        style={{ fontSize: "16px", marginLeft: "4px" }}
        title={toolTip}>{"\u21C5"}</div>
);