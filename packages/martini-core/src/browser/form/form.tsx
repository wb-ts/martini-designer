import { CommandRegistry } from "@phosphor/commands";
import { Menu } from "@phosphor/widgets";
import { connect, ErrorMessage, ErrorMessageProps, useFormikContext, FormikErrors, yupToFormErrors } from "formik";
import messages from "martini-messages/lib/messages";
import { flatten } from "lodash";
import * as React from "react";
import * as Yup from "yup";
export interface FormRowProps {
    name: string;
    label: string;
    tooltip?: string;
    defaultValue?: any;
    gridTemplateColumns?: string;
    showErrorMessage?: boolean;
}

export const FormRow: React.FC<FormRowProps> = ({
    name,
    label,
    tooltip,
    defaultValue,
    gridTemplateColumns,
    showErrorMessage,
    children
}) => {
    const context = useFormikContext<any>();
    const handleContextMenu = (e: React.MouseEvent) => {
        const commands = new CommandRegistry();
        commands.addCommand("revert", {
            label: messages.revert,
            execute: () => context.setFieldValue(name, context.initialValues[name]),
            isVisible: () => context.initialValues[name] !== context.values[name]
        });
        commands.addCommand("reset", {
            label: messages.reset_default,
            execute: () => context.setFieldValue(name, defaultValue),
            isVisible: () => defaultValue !== undefined && context.values[name] !== defaultValue
        });

        const menu = new Menu({
            commands
        });
        menu.addItem({
            command: "revert"
        });
        menu.addItem({
            command: "reset"
        });
        menu.open(e.clientX, e.clientY);
        e.preventDefault();
    };

    return <>
        <label
            htmlFor={name}
            style={{ verticalAlign: "center", marginTop: "3px" }}
            title={tooltip}
            onContextMenu={handleContextMenu}
        >
            {label}
        </label>
        <div
            style={{
                display: "grid",
                gridTemplateColumns: gridTemplateColumns ? gridTemplateColumns : "1fr",
                gridTemplateRows: "max-content 1fr"
            }}
        >
            {children}
            {(showErrorMessage === undefined || showErrorMessage) && <FormErrorMessageWrapper>
                <FormErrorMessage name={name} />
            </FormErrorMessageWrapper>}
        </div>
    </>;
};

export const FormErrorMessage: React.FC<ErrorMessageProps & { error?: string; }> = (props) => (<ErrorMessage
    {...props}
    name={props.name}
    component="div"
    render={(error: string) => (
        <div className="form-input-error-message" title={error}>
            {error}
        </div>
    )}
/>
);

export const FormErrorMessageWrapper: React.FC = ({ children }) => (
    <div className="form-error-message-wrapper">{children}</div>);

export interface OnFormChangeProps<T> {
    onChange: (values: T) => void;
}

/**
 * Component that will call the give onChange function when the values of the form changed.
 */
export const OnFormChange: React.FC<OnFormChangeProps<any> & any> = connect(({ onChange, formik }) => {
    const { values } = formik;
    React.useEffect(() => {
        onChange(formik.values);
    }, [values]);
    return <></>;
}) as React.FC<OnFormChangeProps<any>>;

export interface FormEffect {
    deps?: React.DependencyList;
}

/**
 * Effect component that will revalidate the form when the given deps changed.
 */
export const FormEffect: React.FC<FormEffect> = connect(({ deps, formik }) => {
    const { values, validateForm } = formik;
    React.useEffect(() => {
        validateForm(values);
    }, deps);
    return <></>;
}) as React.FC<FormEffect>;

export interface FormError {
    label: string;
    message: string;
}

export const flattenFormikErrors = (errors: FormikErrors<any>, currentPath?: string): Array<{ key: string; message: string; }> => {
    return flatten(
        Object.entries(errors)
            .filter(([key, value]) => !!value)
            .map<{ key: string; message: string; } | Array<{ key: string; message: string; }>>(([key, value]) => {
                const path = currentPath ? `${currentPath}.${key}` : key;
                return typeof value === "object"
                    // @ts-ignore
                    ? flattenFormikErrors(value, path)
                    : { key: path, message: value! };
            })
    );
};

export const convertFormikErrors = (node: HTMLElement, errors: FormikErrors<any>): FormError[] => {
    return flattenFormikErrors(errors)
        .map<FormError | undefined>(({ key, message }) => {
            const label = node.querySelector(`label[for="${key}"]`);
            if (label)
                return {
                    label: label.textContent as string,
                    message,
                };
        })
        .filter(o => o !== undefined) as FormError[];
};

export const errorsToString = (errors: FormError[]): string => {
    return errors.map(error => `${error.label}: ${error.message}`).join("\n");
};

export const validateSchema = <T extends unknown>(schema: Yup.Schema<T>, value: T, callback?: (errors: FormikErrors<T>) => void): FormikErrors<T> => {
    try {
        schema.validateSync(value, { abortEarly: false });
    } catch (error) {
        const errors = yupToFormErrors(error);
        callback?.(errors);
        return errors;
    }
    const errors = {};
    callback?.(errors);
    return errors;
};

export const validateSchemaAsync = async <T extends unknown>(schema: Yup.Schema<T>, value: T, callback?: (errors: FormikErrors<T>) => void): Promise<FormikErrors<T>> => {
    try {
        await schema.validate(value, { abortEarly: false });
    } catch (error) {
        const errors = yupToFormErrors(error);
        callback?.(errors);
        return errors;
    }
    const errors = {};
    callback?.(errors);
    return errors;
};
