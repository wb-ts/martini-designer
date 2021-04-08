import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import { ElementExt } from '@phosphor/domutils';

export interface ListItem {
    label: string;
    data?: any;
    tooltip?: string;
    iconClass?: string;
    selected?: boolean;
}

export interface ListProps {
    items: ListItem[];
    onSelectionChanged?: (item: ListItem) => void;
    onDoubleClick?: (item: ListItem) => void;
    onTextChange?: (text: string) => void;
    filtered?: boolean;
    style?: React.CSSProperties;
    focus?: boolean;
    searchPlaceholder?: string;
}

const ListStyles = styled.ul`
    padding: 0px;
    margin-top: 0px;
    width: 100%;
    height: 100%;
    overflow-y: auto;

    .item {
        list-style: none;
        padding: 4px;
        display: grid;
        grid-template-columns: max-content 1fr;
        cursor: pointer;
    }

    .message {
        list-style: none;
        padding: 4px;
        display: grid;
        justify-items: center;
    }

    .item-selected {
        background-color: var(--theia-list-activeSelectionBackground);
    }
`;

export const List: React.FC<ListProps> = (props) => {
    const [items, setItems] = React.useState(props.items);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const doFocus = () => {
        if (props.focus) {
            if (props.filtered && searchInputRef.current)
                searchInputRef.current.focus();
            else if (listRef.current)
                listRef.current.focus();
        }
    };

    React.useEffect(doFocus, []);
    React.useEffect(doFocus, [props.focus]);
    React.useEffect(() => setItems(props.items), [props.items]);

    const handleClick = (item: ListItem) => {
        const updatedItems = items.map(item => ({ ...item }));
        updatedItems.forEach(other => other.selected = other.label === item.label);
        setItems(updatedItems);
        if (props.onSelectionChanged)
            props.onSelectionChanged(item);
    };

    const handleDoubleClick = (item: ListItem) => {
        if (props.onDoubleClick)
            props.onDoubleClick(item);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            if (items.length === 0)
                return;
            e.preventDefault();
            let index = items.findIndex(other => other.selected);
            if (e.key === "ArrowUp")
                index = index - 1 < 0 ? items.length - 1 : index - 1;
            else if (e.key === "ArrowDown")
                index = index + 1 >= items.length ? 0 : index + 1;

            if (listRef.current) {
                const liElem = listRef.current.children.item(index);
                if (liElem)
                    ElementExt.scrollIntoViewIfNeeded(listRef.current, liElem);
            }
            handleClick(items[index]);
        }
    };

    const list = <ListStyles
        tabIndex={0}
        className="theia-input"
        onKeyDown={e => handleKeyDown(e)}
        style={!props.filtered ? props.style : undefined}
        ref={listRef}
    >
        {props.filtered && items.length === 0 ?
            <li className="message">{messages.no_matches}</li> :
            items.map((item, i) => (
                <li
                    key={i}
                    onClick={() => handleClick(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    className={"item " + (item.selected ? "item-selected" : "")}
                    title={item.tooltip}
                >
                    {item.iconClass && <span className={item.iconClass} />}
                    {item.label}
                </li>
            ))}
    </ListStyles>;

    if (!props.filtered)
        return list;

    const handleSearch = (search: string) => {
        if (props.onTextChange)
            props.onTextChange(search);
        else {
            search = search.toLowerCase();
            let _items;
            if (!search || search.length === 0)
                _items = [...props.items];
            else
                _items = props.items.filter(item => item.label.toLowerCase().includes(search));
            _items.forEach((item, i) => item.selected = i === 0);
            setItems(_items);
            if (props.onSelectionChanged && _items.length !== 0)
                props.onSelectionChanged(_items[0]);
        }
    };

    return <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridRowGap: "4px",
        gridTemplateRows: "max-content 1fr",
        ...props.style
    }}>
        <input
            ref={searchInputRef}
            type="text"
            className="theia-input"
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={props.searchPlaceholder || messages.search_placeholder}
        />
        {list}
    </div>;
};
