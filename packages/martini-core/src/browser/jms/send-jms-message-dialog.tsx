import { DialogMode } from "@theia/core/lib/browser";
import { encode } from "base64-arraybuffer";
import { Field, Form, Formik, FormikErrors } from "formik";
import { inject, injectable, interfaces } from "inversify";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as yup from 'yup';
import { Destination, destinationPattern, MartiniBrokerManager } from "../../common/jms/martini-broker-manager";
import { FilePicker } from "../components/file-picker";
import { RadioButton } from "../components/radio-button";
import { applySize, BaseDialog, ConfirmDialog } from "../dialogs/dialogs";
import { FormEffect, FormErrorMessage, FormErrorMessageWrapper, FormRow, OnFormChange, validateSchema } from "../form/form";
import "../yup/yup-ext";
import { DestinationPickerDialog, DestinationPickerDialogProps } from "./destination-picker-dialog";

export interface SendJmsMessageFormProps {
    config: SendJmsMessageConfig,
    onBrowseDestination?: () => void;
    onValidate?: (errors: FormikErrors<SendJmsMessageConfig>) => void;
    onChange: (config: SendJmsMessageConfig) => void;
}

export enum MessageType {
    RAW_TEXT,
    FILE
}

export interface SendJmsMessageConfig {
    destination: string;
    messageType: MessageType;
    message: string;
    messageFileOrUrl: string | File;
}

export const SendJmsMessageForm: React.FC<SendJmsMessageFormProps> = (
    {
        onValidate,
        onChange,
        onBrowseDestination,
        config: {
            destination,
            messageType,
            message,
            messageFileOrUrl
        }
    }
) => {
    const schema = React.useMemo(() => yup.object().shape({
        destination: yup.string()
            .trim()
            .required()
            .matches(destinationPattern, messages.invalid_destination_format),
        message: yup.string()
            .when("messageType", {
                is: MessageType.RAW_TEXT,
                then: yup.string().trim().required()
            }),
        messageFileOrUrl: yup.mixed()
            .when("messageType", {
                is: MessageType.FILE,
                then: yup.string().when("messageFileOrUrl", {
                    is: (...values) => values.every(value => typeof value === "string"),
                    then: yup.string().trim().required().url()
                })
            })
    }), []);
    return <Formik
        initialValues={{
            destination,
            messageType,
            message,
            messageFileOrUrl
        }}
        initialTouched={{
            destination: true,
            messageType: true,
            message: true,
            messageFileOrUrl: true
        }}
        validate={config => validateSchema(schema, config, onValidate)}
        validateOnMount={true}
        enableReinitialize={true}
        onSubmit={noop}
    >
        {({ values, setValues }) => {
            const handleMessageTypeChange = (type: MessageType) => {
                setValues({
                    ...values,
                    messageType: type
                });
            };
            const handleMessageFileChange = (fileOrUrl: string | File) => {
                setValues({
                    ...values,
                    messageFileOrUrl: fileOrUrl
                });
            };
            const handleBrownDestinationClick = () => {
                if (onBrowseDestination)
                    onBrowseDestination();
            };
            const destinationInput = React.useRef<HTMLInputElement>(null);

            React.useEffect(() => {
                if (destinationInput.current)
                    destinationInput.current.focus();
            }, []);
            return <Form
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
            >
                <OnFormChange onChange={onChange} />
                <FormEffect deps={[destination]} />
                <FormRow
                    name="destination"
                    label={messages.destination}
                    showErrorMessage={false}
                    gridTemplateColumns="1fr max-content"
                >
                    <Field type="text" name="destination" className="theia-input" innerRef={destinationInput} />
                    <input
                        type="button"
                        className="theia-button"
                        value={messages.browse_btn}
                        onClick={handleBrownDestinationClick}
                    />
                    <FormErrorMessageWrapper>
                        <FormErrorMessage name="destination" />
                    </FormErrorMessageWrapper>
                </FormRow>
                <FormRow name="message" label={messages.message}>
                    <div style={{ marginBottom: "5px", display: "grid", gridTemplateColumns: "max-content max-content" }}>
                        <RadioButton
                            name="messageType"
                            label={messages.raw_text}
                            onChange={_ => handleMessageTypeChange(MessageType.RAW_TEXT)}
                            checked={values.messageType === MessageType.RAW_TEXT}
                            value={MessageType.RAW_TEXT}
                        />
                        <RadioButton
                            name="messageType"
                            label={messages.file_or_url}
                            onChange={_ => handleMessageTypeChange(MessageType.FILE)}
                            checked={values.messageType === MessageType.FILE}
                            value={MessageType.FILE}
                        />
                    </div>
                    {values.messageType === MessageType.RAW_TEXT ? (
                        <Field
                            style={{ resize: "none" }}
                            as="textarea"
                            name="message"
                            className="theia-input"
                            rows="5"
                        />
                    ) : (
                            <FilePicker
                                onChange={handleMessageFileChange}
                                value={values.messageFileOrUrl}
                                placeholder={messages.drop_browse_file_url}
                            >
                                <FormErrorMessageWrapper>
                                    <FormErrorMessage name="messageFileOrUrl" />
                                </FormErrorMessageWrapper>
                            </FilePicker>
                        )}
                </FormRow>
            </Form>;
        }}
    </Formik>;
};

export class SendJmsMessageDialogProps {
}

@injectable()
export class SendJmsMessageDialog extends BaseDialog<void> {
    @inject("Factory<DestinationPickerDialog>")
    private readonly destinationDialogFactory: (props: DestinationPickerDialogProps) => DestinationPickerDialog;
    @inject(MartiniBrokerManager)
    private readonly brokerManager: MartiniBrokerManager;
    private valid: boolean = false;

    private config: SendJmsMessageConfig = {
        messageType: MessageType.RAW_TEXT,
        message: "",
        destination: "",
        messageFileOrUrl: ""
    };
    value: undefined;

    constructor(
        @inject(SendJmsMessageDialogProps)
        props: SendJmsMessageDialogProps
    ) {
        super({ title: messages.send_jms_message_dialog_title });
        applySize(this.contentNode, { height: 220, width: 600 });
        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.send_btn);
    }

    protected isValid(value: undefined, mode: DialogMode) {
        return this.valid;
    }

    protected doRender(): React.ReactNode {
        return <>
            <SendJmsMessageForm
                config={this.config}
                onValidate={errors =>
                    this.handleValidate(errors)}
                onChange={config => this.handleChange(config)}
                onBrowseDestination={() => this.handleBrowseDestination()}
            />
        </>;
    }

    protected async accept(): Promise<void> {
        const { messageType, destination, message, messageFileOrUrl } = this.config;
        await this.showProgress(messages.sending_jms_message, async _ => {
            if (messageType === MessageType.RAW_TEXT)
                await this.brokerManager.sendString(destination, message);
            else if (messageType === MessageType.FILE) {
                if (typeof messageFileOrUrl === "string")
                    await this.brokerManager.sendBytesFromUrl(destination, messageFileOrUrl as string);
                else if (messageFileOrUrl instanceof File) {
                    const file = encode(await messageFileOrUrl.arrayBuffer());
                    await this.brokerManager.sendBytes(destination, file);
                }
            }

            new ConfirmDialog({
                title: messages.success_title,
                msg: messages.message_sent,
                showCancel: false
            }).open();
        });
    }

    private handleChange(config: SendJmsMessageConfig) {
        this.config = config;
    }

    private handleValidate(errors: FormikErrors<SendJmsMessageConfig>) {
        this.valid = Object.keys(errors).length === 0;
        this.validate();
    }

    private async handleBrowseDestination() {
        const destination = await this.destinationDialogFactory({
            initialDestination: Destination.toDestination(this.config.destination)
        }).open();
        if (destination) {
            this.config.destination = Destination.toString(destination);
            this.update();
        }
    }
}

export const bindSendJmsMessageDialogBindings = (bind: interfaces.Bind) => {
    bind("Factory<SendJmsMessageDialog>").toFactory(ctx => (props: SendJmsMessageDialogProps) => {
        const child = ctx.container.createChild();
        child.bind(SendJmsMessageDialogProps).toConstantValue(props);
        child.bind(SendJmsMessageDialog).toSelf();
        return child.get(SendJmsMessageDialog);
    });
};
