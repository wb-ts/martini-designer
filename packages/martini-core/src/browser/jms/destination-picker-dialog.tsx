import { DialogMode } from "@theia/core/lib/browser";
import { Field, Form, Formik, FormikErrors, FormikProps, yupToFormErrors } from "formik";
import { inject, injectable, interfaces } from "inversify";
import { capitalize } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as yup from "yup";
import { Destination, DestinationType, MartiniBrokerManager } from "../../common/jms/martini-broker-manager";
import { List, ListItem } from "../components/list";
import { RadioButton } from "../components/radio-button";
import { applySize, BaseDialog } from "../dialogs/dialogs";
import { FormRow, OnFormChange } from "../form/form";
import { Progress } from "../progress/progress-service";

export interface DestinationListProps {
    defaultSelectedDestination?: Destination;
    destinations: Destination[];
    onSelectionChange?: (destination: Destination) => void;
    onDoubleClick?: (destination: Destination) => void;
}

export const DestinationList: React.FC<DestinationListProps> = ({ defaultSelectedDestination, destinations, onSelectionChange, onDoubleClick }) => {
    const destinationItems: ListItem[] = React.useMemo(() => destinations
        .map(destination => ({
            label: Destination.toString(destination),
            data: destination,
            selected: defaultSelectedDestination && Destination.equals(destination, defaultSelectedDestination),
            iconClass: `martini-tree-icon martini-jms-${destination.type.toLowerCase()}-icon`
        })), [destinations]);

    const handleSelectionChange = (item: ListItem) => {
        if (onSelectionChange)
            onSelectionChange(item.data);
    };

    const handleDoubleClick = (item: ListItem) => {
        if (onDoubleClick)
            onDoubleClick(item.data);
    };

    return <List
        focus={true}
        filtered={true}
        items={destinationItems}
        onSelectionChanged={handleSelectionChange}
        onDoubleClick={handleDoubleClick}
        style={{ height: "100%" }}
    />;
};

export interface DestinationPickerProps {
    destinations: Destination[];
    selectedDestination?: Destination;
    onChange: (destination: Destination | undefined) => void;
    onValidate?: (destination: Destination | undefined, errors: FormikErrors<DestinationConfig>) => void;
    onSelect?: (destination: Destination) => void;
}

interface DestinationConfig {
    create: boolean;
    selectedDestination?: Destination;
    newDestinationName: string;
    newDestinationType: DestinationType;
}

export const DestinationPicker: React.FC<DestinationPickerProps> = (
    {
        destinations,
        selectedDestination,
        onChange,
        onValidate,
        onSelect,
    }
) => {
    const schema = React.useMemo(() => yup.object()
        .shape({
            newDestinationName: yup.string()
                .when("create", {
                    is: true,
                    then: yup.string()
                        .trim()
                        .required()
                        .test('unique',
                            messages.destination_name_exists,
                            value => !destinations.map(destination => destination.name).some(name => name === value))
                })
        }), [destinations]);

    const handleFormChange = (config: DestinationConfig) => {
        if (config.create) {
            onChange({
                name: config.newDestinationName,
                type: config.newDestinationType
            });
        } else
            onChange(config.selectedDestination);
    };

    return <Formik
        initialValues={{
            create: false,
            selectedDestination,
            newDestinationName: "",
            newDestinationType: DestinationType.QUEUE
        }}
        initialTouched={{
            create: true,
            selectedDestination: true,
            newDestinationName: true,
            newDestinationType: true
        }}
        validate={async (config: DestinationConfig) => {
            let errors: FormikErrors<DestinationConfig> = {};

            try {
                await schema.validate(config, { abortEarly: false });
            } catch (error) {
                errors = yupToFormErrors(error);
            }

            if (onValidate)
                onValidate(config.create ?
                    { name: config.newDestinationName, type: config.newDestinationType } :
                    config.selectedDestination, errors);

            return errors;
        }}
        enableReinitialize={true}
        validateOnMount={true}
        onSubmit={_ => {
        }}
    >
        {(props: FormikProps<DestinationConfig>) => {
            const { values, setValues } = props;
            const handleCreateChange = (create: boolean) => {
                setValues({
                    ...values,
                    create
                });
            };

            const handleSelectedDestinationChange = (selectedDestination: Destination) => {
                setValues({
                    ...values,
                    selectedDestination
                });
            };

            const handleDestinationDoubleClick = (selectedDestination: Destination) => {
                if (onSelect)
                    onSelect(selectedDestination);
            };

            const handleTypeChange = (newDestinationType: DestinationType) => {
                setValues({
                    ...values,
                    newDestinationType
                });
            };

            return <Form
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
            >
                <OnFormChange onChange={handleFormChange} />
                <FormRow name="create" label="From:">
                    <RadioButton
                        name="create"
                        value={false}
                        label={messages.existing_destinations_title}
                        onChange={_ => handleCreateChange(false)}
                        checked={!values.create}
                    />
                    <RadioButton
                        name="create"
                        label={messages.new_destinations_title}
                        value={true}
                        onChange={_ => handleCreateChange(true)}
                        checked={values.create}
                    />
                </FormRow>

                {!values.create ? (
                    <div style={{ gridColumn: "span 2", height: "310px" }}>
                        <DestinationList
                            onSelectionChange={handleSelectedDestinationChange}
                            defaultSelectedDestination={values.selectedDestination}
                            destinations={destinations}
                            onDoubleClick={handleDestinationDoubleClick}
                        />
                    </div>
                ) : (
                        <>
                            <FormRow name="newDestinationName" label="Name:">
                                <Field
                                    name="newDestinationName"
                                    className="theia-input"
                                />
                            </FormRow>
                            <FormRow name="newDestinationType" label="Type:">
                                <RadioButton
                                    name="newDestinationType"
                                    label={capitalize(DestinationType.QUEUE)}
                                    value={DestinationType.QUEUE}
                                    onChange={_ => handleTypeChange(DestinationType.QUEUE)}
                                    checked={values.newDestinationType === DestinationType.QUEUE}
                                />
                                <RadioButton
                                    name="newDestinationType"
                                    label={capitalize(DestinationType.TOPIC)}
                                    value={DestinationType.TOPIC}
                                    onChange={_ => handleTypeChange(DestinationType.TOPIC)}
                                    checked={values.newDestinationType === DestinationType.TOPIC}
                                />
                            </FormRow>
                        </>
                    )}
            </Form>;
        }}
    </Formik>;
};

export interface DestinationPickerDialogProps {
    initialDestination?: Destination;
}

export const DestinationPickerDialogProps = Symbol("DestinationPickerDialogProps");

@injectable()
export class DestinationPickerDialog extends BaseDialog<Destination> {
    @inject(MartiniBrokerManager)
    private readonly brokerManager: MartiniBrokerManager;

    private destination: Destination;
    private destinations: Destination[] = [];
    private valid = true;

    constructor(
        @inject(DestinationPickerDialogProps)
        private readonly _props: DestinationPickerDialogProps
    ) {
        super({
            title: messages.destination_dialog_title
        });
        applySize(this.contentNode, { width: 500, height: 400 });
        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.apply_btn);
        this.destination = _props.initialDestination!;
    }

    protected async init(progress: Progress): Promise<void> {
        progress.report({
            message: messages.fetching_jms_destinations
        });
        this.destinations = (await this.brokerManager.getDestinations());
        return super.init(progress);
    }

    protected isValid(value: Destination, mode: DialogMode) {
        return this.valid;
    }

    get value(): Destination {
        return this.destination;
    }

    protected doRender(): React.ReactNode {
        return <DestinationPicker
            selectedDestination={this._props.initialDestination}
            onChange={destination => this.handleChange(destination)}
            onValidate={(_, errors) => this.handleValidate(_, errors)}
            onSelect={async destination => {
                this.handleChange(destination);
                await this.accept();
            }}
            destinations={this.destinations} />;
    }

    private handleChange(destination: Destination | undefined) {
        this.destination = destination!;
    }

    private handleValidate(destination: Destination | undefined, errors: FormikErrors<DestinationConfig>) {
        this.valid = Object.keys(errors).length === 0 && destination !== undefined;
        this.validate();
    }
}

export const bindDestinationPickerDialogBindings = (bind: interfaces.Bind) => {
    bind("Factory<DestinationPickerDialog>").toFactory(ctx => (props: DestinationPickerDialogProps) => {
        const child = ctx.container.createChild();
        child.bind(DestinationPickerDialogProps).toConstantValue(props);
        child.bind(DestinationPickerDialog).toSelf();
        return child.get(DestinationPickerDialog);
    });
};
