import * as React from "react";
import styled from "styled-components";
import { ElementExt } from '@phosphor/domutils';

export interface Suggestion {
    label: string;
    iconClass?: string;
}

export interface AutocompleteProps {
    value: string;
    suggestions: Suggestion[];
    onInputChange: (input: string) => void;
    onInputBlur?: (e: React.FocusEvent<HTMLInputElement>, input: string) => void;
    onSuggestionSelect?: (input: string) => void;
    onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onInputKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputStyle?: React.CSSProperties;
    autoFocus?: boolean;
}

const UlStyles = styled.ul`
    color: var(--theia-input-foreground);
    background-color: var(--theia-input-background);
    border: 1px solid var(--theia-inputOption-activeBorder);
    border-top: 0;
    position: absolute;
    top: 25px;
    left: 0px;
    width: calc(100% - 2px);
    list-style: none;
    margin-top: 0;
    max-height: 143px;
    overflow-y: auto;
    padding-left: 0;
    z-index: 20;

    li {
        padding: 4px;
    }

    .suggestion-active, li:hover {
        background-color: var(--theia-list-activeSelectionBackground);
        color: var(--theia-input-foreground);
        cursor: pointer;
    }
`;

export const Autocomplete: React.FC<AutocompleteProps> = ({
    value,
    suggestions,
    onInputChange,
    onInputBlur,
    onSuggestionSelect,
    onInputKeyDown,
    onInputKeyUp,
    inputStyle,
    autoFocus
}) => {
    const [activeSuggestion, setActiveSuggestion] = React.useState(0);
    const [filteredSuggestions, setFilteredSuggestions] = React.useState([] as Suggestion[]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const mounted = React.useRef(true);
    React.useEffect(() => {
        if (autoFocus && inputRef.current)
            inputRef.current.setSelectionRange(0, value.length);
        return () => { mounted.current = false; };
    }, []);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const ulRef = React.useRef<HTMLUListElement>(null);

    const filter = (input: string) => input.length === 0 ? suggestions : suggestions.filter(
        suggestion =>
            suggestion.label.toLowerCase().includes(input)
    );

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setActiveSuggestion(0);
        setFilteredSuggestions(filter(input.toLowerCase()));
        setShowSuggestions(true);
        onInputChange(input);
    };

    const onClick = (suggestion: Suggestion) => {
        setActiveSuggestion(0);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        onInputChange(suggestion.label);
        if (onSuggestionSelect)
            onSuggestionSelect(suggestion.label);
        inputRef.current?.focus();
    };

    const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && showSuggestions && filteredSuggestions.length !== 0) {
            const label = filteredSuggestions[activeSuggestion].label;
            setActiveSuggestion(0);
            setShowSuggestions(false);
            onInputChange(label);
            if (onSuggestionSelect)
                onSuggestionSelect(label);
            return;
        }
        else if (e.key === "Escape" && showSuggestions) {
            setShowSuggestions(false);
            return;
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            let next = activeSuggestion - 1;

            if (next < 0)
                next = filteredSuggestions.length - 1;

            setActiveSuggestion(next);
            if (ulRef.current)
                ElementExt.scrollIntoViewIfNeeded(ulRef.current, ulRef.current.childNodes[next] as HTMLLIElement);
            return;
        }
        else if (e.key === "ArrowDown") {
            e.preventDefault();
            let next = activeSuggestion + 1;

            if (next >= filteredSuggestions.length)
                next = 0;

            setActiveSuggestion(next);
            if (ulRef.current)
                ElementExt.scrollIntoViewIfNeeded(ulRef.current, ulRef.current.childNodes[next] as HTMLLIElement);
            return;
        }
        else if (!showSuggestions && e.key === " " && e.ctrlKey) {
            setShowSuggestions(true);
            return;
        }

        if (onInputKeyUp)
            onInputKeyUp(e);
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // when e.relatedTarget === null it means it probably click one of the suggestions
        if (e.relatedTarget !== null && onInputBlur) {
            onInputBlur(e, value);
            setShowSuggestions(false);
        }
    };

    let suggestionsListComponent;

    if (showSuggestions && filteredSuggestions.length) {
        suggestionsListComponent = (
            <UlStyles ref={ulRef}>
                {filteredSuggestions.map((suggestion, index) => {
                    return (
                        <li
                            className={index === activeSuggestion ? "suggestion-active" : undefined}
                            key={suggestion.label}
                            onClick={() => onClick(suggestion)}
                        >
                            {suggestion.label}
                        </li>
                    );
                })}
            </UlStyles>
        );
    }

    return <>
        <input
            type="text"
            autoFocus={autoFocus}
            ref={inputRef}
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            onKeyDown={onInputKeyDown}
            onKeyUp={onKeyUp}
            className="theia-input"
            style={inputStyle}
        />
        {suggestionsListComponent}
    </>;
};
