import * as React from "react";
import styled from "styled-components";

export interface RadioButtonProps {
    label?: string;
    name?: string;
    value?: any;
    checked?: boolean;
    onChange?: (value: any) => void;
}

const RadioButtonStyles = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    grid-column-gap: 4px;
    align-items: center;
    margin-bottom: 4px;

    .label {
        cursor: pointer;
    }
`;

export const RadioButton: React.FC<RadioButtonProps> = ({
    label,
    name,
    value,
    checked,
    onChange
}) => {
    const handleChange = () => {
        if (onChange)
            onChange(value);
    };
    const makeButton = () => (
        <input
            type="radio"
            checked={checked}
            name={name}
            onChange={handleChange}
            value={value}
        />
    );

    if (!label)
        return makeButton();

    return <RadioButtonStyles>
        {makeButton()}
        <div className="label" onClick={handleChange}>{label}</div>
    </RadioButtonStyles>;
};
