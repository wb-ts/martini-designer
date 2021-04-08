import * as React from "react";
import styled from "styled-components";
import messages from "martini-messages/lib/messages";
import { CommandRegistry } from "@phosphor/commands";

const SearchBoxStyles = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content max-content max-content max-content;
    grid-column-gap: 4px;
    padding: var(--theia-ui-padding);

    .search-input {
        width: 150px;
    }

    .message {
        min-width: 80px;
    }
`;

export interface SearchBoxProps {
    onTextChange?: (text: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onClose?: () => void;
    message?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
    onTextChange,
    onKeyDown,
    onPrevious,
    onNext,
    onClose,
    message,
    inputRef
}) => {
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onTextChange)
            onTextChange(e.currentTarget.value);
    };

    return <SearchBoxStyles
        onKeyDown={onKeyDown}
    >
        <input
            type="text"
            className="theia-input search-input"
            placeholder={messages.search_placeholder}
            ref={inputRef}
            onChange={e => handleTextChange(e)}
        />
        <div className="message">{message || ""}</div>
        <div
            className="theia-search-button theia-search-button-previous"
            title={`${messages.previous} (${CommandRegistry.formatKeystroke("Accel Enter")})`}
            onClick={onPrevious}
        />
        <div
            className="theia-search-button theia-search-button-next"
            title={`${messages.next} (${CommandRegistry.formatKeystroke("Enter")})`}
            onClick={onNext}
        />
        <div
            className="theia-search-button theia-search-button-close"
            title={`${messages.close} (${CommandRegistry.formatKeystroke("Escape")})`}
            onClick={onClose}
        />
    </SearchBoxStyles>;
};
