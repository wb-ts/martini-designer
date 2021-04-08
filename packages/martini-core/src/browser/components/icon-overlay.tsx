import * as React from "react";

export interface IconProps {
    iconClass: string;
}

export const Icon: React.FC<IconProps> = ({ iconClass, children }) => (<div
    className={`martini-tree-icon ${iconClass}`}
    style={{ position: "relative", marginRight: "4px" }}
>
    {children}
</div>);

export interface OverlayIconProps extends IconProps {
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    width?: number;
    height?: number;
}

export const OverlayIcon: React.FC<OverlayIconProps> = (props) => {
    return <div className={props.iconClass} style={getStyle(props)} />;
};

const getStyle = (props: OverlayIconProps) => {
    const width = props.width === undefined ? 8 : props.width;
    const height = props.height === undefined ? 8 : props.height;
    const style: any = {
        backgroundSize: `${width}px ${height}px`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        position: "absolute",
        width,
        height
    };

    switch (props.position) {
        case "top-left":
            style.left = "0";
            style.top = "0";
            break;
        case "top-right":
            style.right = "0";
            style.top = "0";
            break;
        case "bottom-left":
            style.left = "0";
            style.bottom = "0";
            break;
        case "bottom-right":
            style.right = "0";
            style.bottom = "0";
            break;
    }
    return style;
};
