import * as React from "react";
import styled from "styled-components";

const Styles = styled.div`
    display: grid;
    grid-column-gap: 4px;
    grid-row-gap: 4px;

    .item {
        display: grid;
        padding: 2px;
        height: 16px;
    }

    .item-enabled {
        cursor: pointer;
    }

    .item-toggled {
        background-color: var(--theia-checkbox-background);
        outline: var(--checkbox-background-toggled-outline) solid 1px;
    }

    .active {
        transform: scale(1.272019649);
    }

    .separator {
        border-left: 1px solid var(--theia-menu-separatorBackground);
    }
`;

export interface ToolBarProps {
    layout?: "horizontal" | "vertical";
    styles?: React.CSSProperties;
    onMouseDown?: (e: React.MouseEvent) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({ layout, styles, onMouseDown, children }) => {
    const _layout = layout || "horizontal";

    return <Styles
        style={{
            ...(styles ? styles : {}),
            gridTemplateColumns: children && _layout === "horizontal" ? `repeat(${React.Children.count(children)}, max-content)` : undefined,
            height: _layout === "vertical" ? "fit-content" : undefined
        }}
        onMouseDown={onMouseDown}
    >
        {children}
    </Styles>;
};

export interface ToolbarItemProps {
    label?: string;
    iconClass?: string;
    disabledIconClass?: string;
    tooltip?: string;
    onClick?: (e: React.MouseEvent) => void;
    enabled?: boolean | (() => boolean);
    toggled?: boolean | (() => boolean);
}

export const ToolBarItem: React.FC<ToolbarItemProps> = ({
    label,
    iconClass,
    disabledIconClass,
    tooltip,
    onClick,
    enabled,
    toggled
}) => {
    const [active, setActive] = React.useState(false);

    let _enabled = true;
    if (typeof enabled === "function")
        _enabled = enabled();
    else if (typeof enabled === "boolean")
        _enabled = enabled;

    let _toggled = false;

    if (typeof toggled === "function")
        _toggled = toggled();
    else if (typeof toggled === "boolean")
        _toggled = toggled;

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (_enabled && e.button === 0)
            setActive(true);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        setActive(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (_enabled && onClick)
            onClick(e);
    };

    const classNames = ["item"];

    if (_enabled)
        classNames.push("item-enabled");
    else if (!disabledIconClass && iconClass)
        disabledIconClass = `${iconClass} disabled-icon`;

    if (_toggled)
        classNames.push("item-toggled");
    if (active)
        classNames.push("active");
    return <div
        className={classNames.join(" ")}
        title={tooltip}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
    >
        {iconClass &&
            <div style={{ width: "16px" }}
                className={`martini-icon ${_enabled ? iconClass : disabledIconClass || iconClass}`} />}
        {label}
    </div>;
};

export const ToolBarItemSeparator: React.FC = () => <div className="separator" />;
