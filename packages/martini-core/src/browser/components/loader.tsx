import * as React from "react";
import styled from "styled-components";

const LoaderStyles = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .wrapper {
        display: grid;
        width: 100%;
        height: 100%;
        justify-items: center;
        grid-row-gap: 10px;
    }

    .progress-loader-end {
        align-self: end;
    }

    .progress-loader-center {
        align-self: center;
    }

    .progress-message {
        align-self: start;
    }
`;

export interface LoaderProps {
    message?: string;
    style?: React.CSSProperties;
}

export const Loader: React.FC<LoaderProps> = ({ message, style }) => (<LoaderStyles style={style}>
    <div className="wrapper">
        <div className={message ? "loader-large progress-loader-end" : "loader-large progress-loader-center"} />
        {message && <div className="progress-message">{message}</div>}
    </div>
</LoaderStyles>);
