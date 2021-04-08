import { MaybePromise } from "@theia/core";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import styled from "styled-components";
import * as yup from "yup";
import { Autocomplete, Suggestion } from "./autocomplete";

export interface CellEditor<T> {
    value: T;
    validate?: (value: T) => string | undefined;
    onApply?: (value: T) => void;
    onCancel?: () => void;
    readOnly: boolean;
}

export const CellEditorProvider = Symbol("CellEditorProvider");

export interface CellEditorProvider<T> {
    (props: CellEditorProps<T>): React.ReactNode;
}

export interface CellEditorProps<T> {
    editor: CellEditor<T>;
}

export interface TextCellEditorProps extends CellEditorProps<string> {
    minLength?: number;
    maxLength?: number;
    suggestions?: Suggestion[];
    autoFocus?: boolean;
}

const TextCellEditorStyles = styled.div`
    width: 100%;
    display: grid;
    margin: 0;
    padding: 0;
    overflow-y: visible;
    position: relative;

    input {
        min-width: 0;
    }
`;

export const TextCellEditor: React.FC<TextCellEditorProps> = ({
    editor,
    minLength,
    maxLength,
    suggestions,
    autoFocus
}) => {
    const schema = React.useMemo(() => yup.string().min(minLength || 0).max(maxLength || Number.MAX_VALUE), []);
    const getValue = () =>
        editor.value === undefined ? "" : editor.value;
    const valueChanged = React.useRef(false);
    const [value, setValue] = React.useState(getValue());
    const [error, setError] = React.useState("");

    const validate = (input: string): string | undefined => {
        try {
            schema.validateSync(input);
        } catch (error) {
            return error.errors[0];
        }

        if (editor.validate)
            return editor.validate(input);
    };

    const onChange = (input: string) => {
        if (editor.readOnly)
            return;
        valueChanged.current = true;
        setValue(input);
        setError(validate(input) || "");
    };

    const apply = (input: string): boolean => {
        if (validate(input) !== undefined) return false;
        if (editor.value !== input && editor.onApply) {
            editor.onApply(input);
            return true;
        }

        if (editor.onCancel)
            editor.onCancel();
        return false;
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            apply(value);
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setValue(getValue());
            setError("");
            if (editor.onCancel)
                editor.onCancel();
        }
    };

    const handleBlur = (input: string) => {
        if (valueChanged.current) {
            if (!apply(input)) {
                setValue(getValue());
            }
        }
        setError("");
        if (editor.onCancel)
            editor.onCancel();
        valueChanged.current = false;
    };

    React.useEffect(() => setValue(getValue()), [editor.value]);
    React.useEffect(() => setError(""), [editor.value]);

    return (
        <TextCellEditorStyles>
            <Autocomplete
                suggestions={suggestions || []}
                value={value}
                onInputChange={onChange}
                onInputBlur={(_, input) => handleBlur(input)}
                onSuggestionSelect={apply}
                onInputKeyUp={handleKeyUp}
                autoFocus={autoFocus}
                inputStyle={{ margin: 0, outlineColor: error.length !== 0 ? "var(--theia-inputValidation-errorBackground)" : undefined }}
            />
            <ErrorOverlay error={error} />
        </TextCellEditorStyles>
    );
};

export interface NumberCellEditorProps extends CellEditorProps<number> {
    min?: number;
    max?: number;
    allowDecimal?: boolean;
    allowBlank?: boolean;
    suggestions?: number[];
}

export const NumberCellEditor: React.FC<NumberCellEditorProps> = (props) => {
    const schema = React.useMemo(() => {
        let schema = yup.number()
            .min(props.min === undefined ? -Number.MAX_VALUE : props.min)
            .max(props.max === undefined ? Number.MAX_VALUE : props.max);
        if (props.allowDecimal === undefined || !props.allowDecimal)
            schema = schema.integer();
        return schema;
    }, []);
    const editor: CellEditor<string> = {
        value: props.editor.value?.toString(),
        onApply: (value: string) => {
            if (value.length === 0 && props.allowBlank)
                value = "";
            else if (editor.validate!(value) !== undefined)
                return;
            if (props.editor.onApply)
                props.editor.onApply(schema.cast(value)!);
        },
        validate: (value: string) => {
            if (value.length === 0 && props.allowBlank)
                return undefined;
            let _value: number;
            try {
                _value = schema.validateSync(value)!;
            } catch (error) {
                return error.errors[0];
            }
            if (props.editor.validate)
                return props.editor.validate(_value);
        },
        readOnly: props.editor.readOnly
    };
    // @ts-ignore
    return <TextCellEditor {...props}
        editor={editor}
        suggestions={props.suggestions?.map(n => ({ label: n.toString() }))}
    />;
};

export const BooleanCellEditor: React.FC<CellEditorProps<boolean>> = ({
    editor
}) => {
    const getValue = () =>
        editor.value === undefined ? false : editor.value;
    const [value, setValue] = React.useState(getValue());
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editor.readOnly)
            return;
        setValue(e.target.checked);
        if (editor.onApply)
            editor.onApply(e.target.checked);
    };
    React.useEffect(() => setValue(getValue()), [editor.value]);

    return (
        <input
            type="checkbox"
            checked={value}
            onChange={onChange}
            className="theia-input"
            style={{ marginLeft: "5px" }}
        />
    );
};

export interface ComboCellEditorProps extends CellEditorProps<string> {
    values: ComboCellEditorProps.Option[];
}

export namespace ComboCellEditorProps {
    export interface Option {
        value: any;
        name: string;
    }
}

export const ComboCellEditor: React.FC<ComboCellEditorProps> = ({
    editor,
    values
}) => {
    const getValue = () =>
        editor.value === undefined ? "" : editor.value;
    const [value, setValue] = React.useState(getValue());
    React.useEffect(() => setValue(getValue()), [editor.value]);
    const handleChange = (
        e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
        if (editor.readOnly)
            return;
        setValue(e.target.value);
        if (editor.onApply)
            editor.onApply(e.target.value);
    };

    return (
        <select
            value={value}
            onChange={handleChange}
            style={{ width: "100%", margin: 0, padding: 0 }}
            className="theia-input"
        >
            {values.map(value => (
                <option key={value.name} value={value.value}>
                    {value.name}
                </option>
            ))}
        </select>
    );
};

export interface DialogCellEditorProps<T> extends CellEditorProps<T> {
    openDialog: (value: T) => MaybePromise<T>;
    renderLabel?: (value: T) => React.ReactNode;
    tooltip?: string;
}

export const DialogCellEditor: React.FC<DialogCellEditorProps<any>> = ({
    editor,
    openDialog,
    renderLabel,
    tooltip
}) => {
    const getValue = () =>
        editor.value === undefined ? false : editor.value;
    const [value, setValue] = React.useState(getValue());
    React.useEffect(() => setValue(getValue()), [editor.value]);

    const handleClick = () => {
        openDialog(value)?.then((newValue: any) => {
            if (newValue !== undefined && !editor.readOnly) {
                setValue(newValue);
                if (editor.onApply)
                    editor.onApply(newValue);
            }
        });
    };

    const handeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter")
            handleClick();
    };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr max-content",
                margin: 0,
                padding: "4px",
                width: "100%",
            }}
            title={tooltip || (value instanceof Array ? value.join("\n") : value.toString())}
            tabIndex={0}
            onKeyDown={handeKeyDown}
        >
            <div
                style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}
                onDoubleClick={handleClick}
            >
                {renderLabel && renderLabel(value)}
                {!renderLabel && (value instanceof Array ? value.join(", ") : value)}
            </div>
            <div onClick={handleClick} title={messages.click_to_edit} style={{ cursor: "pointer" }}>
                <div className="martini-tree-icon martini-edit-icon" />
            </div>
        </div>
    );
};


const ErrorOverlayStyles = styled.div`
    position: absolute;
    top: 24px;
    width: 100%;
    background-color: var(--theia-inputValidation-errorBackground);
    z-index: 10;
    text-overflow: ellipsis;
    overflow: hidden;

    .error-message {
        white-space: pre;
        height: 24px;
        font-size: 10px;
        padding: 4px;
        min-width: 0;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

export const ErrorOverlay: React.FC<{ error: string; }> = ({ error }) => {
    if (!error || error.length === 0)
        return <></>;

    return <ErrorOverlayStyles>
        <div className="error-message" title={error}>{error.replace(/[\r\n]/g, " ")}</div>
    </ErrorOverlayStyles>;
};
