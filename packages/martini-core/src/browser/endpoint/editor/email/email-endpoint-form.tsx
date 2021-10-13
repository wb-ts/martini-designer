import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import { EmailEndpoint, MartiniEndpoint, ReplyEmailSettings } from "../../../../common/endpoint/martini-endpoint-manager";
import { DocumentType } from "../../../../common/tracker/document-type-manager";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";
import "../../../yup/yup-ext";
import { GeneralConfigurationSection, generalSchema } from "../general-config-section";
import { HostType, hostTypes, replyHostTypes } from "./host-type";
import { HostTypeSelectionDialog } from './host-type-selection-dialog';

export interface EmailEndpointFormProps {
    endpoint: MartiniEndpoint;
    reset: boolean;
    documentTypeProvider: () => Promise<DocumentType[]>;
    onChange: (connection: MartiniEndpoint) => void;
    onValidate: (errors: FormikErrors<MartiniEndpoint>) => void;
}

export const EmailEndpointForm: React.FC<EmailEndpointFormProps> = ({
    endpoint,
    reset,
    documentTypeProvider,
    onChange,
    onValidate
}) => {
    const schema = React.useMemo(
        () =>
            Yup.object()
                .shape<Partial<EmailEndpoint>>({
                    host: Yup.string().required(),
                    port: Yup.number().min(1).max(65535).required(),
                    username: Yup.string()
                        .required()
                        .email(),
                    schedule: Yup.string()
                        .required()
                        .min(1)
                        .test("is-positive-integer", messages.must_be_greater_or_equal(1), value => {
                            if (value) {
                                const index = value.lastIndexOf(":");
                                if (index > -1) {
                                    const sub = value.substring(index + 1, value.length + 1);
                                    const interval = Number.parseInt(sub);
                                    if (!isNaN(interval) && interval > 0) return true;
                                }
                            }

                            return false;
                        }),
                    replyEmailSettings: Yup.object<ReplyEmailSettings>().when(["sendOutputAsReply", "sendReplyOnError"], {
                        is: (sendOutputAsReply, sendReplyOnError) => sendOutputAsReply || sendReplyOnError,
                        then: Yup.object().shape<Partial<ReplyEmailSettings>>({
                            host: Yup.string().required(),
                            port: Yup.number().min(1).max(65535).required(),
                            username: Yup.string().email(),
                            from: Yup.string().email()
                        }),
                    })
                })
                .concat(generalSchema),
        []
    );

    const validate = async (endpoint: EmailEndpoint) => validateSchema(schema, endpoint, onValidate);

    return (
        <Formik
            initialValues={endpoint}
            initialTouched={{
                host: true,
                username: true,
                port: true,
                schedule: true,
                replyEmailSettings: {
                    host: true,
                    port: true,
                    username: true,
                    from: true
                }
            }}
            enableReinitialize={reset}
            validate={validate}
            validateOnMount={true}
            onSubmit={noop}
        >
            <Form>
                <OnFormChange onChange={onChange} />
                <GeneralConfigurationSection documentTypeProvider={documentTypeProvider} />
                <EmailConfigurationSection />
                <EmailActionsSection />
            </Form>
        </Formik>
    );
};

const EmailConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<EmailEndpoint>();

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const interval = Number.parseInt(e.currentTarget.value);
        if (isNaN(interval)) context.setFieldValue("schedule", `repeating:${e.currentTarget.value}`);
        else context.setFieldValue("schedule", `repeating:${interval * 1000}`);
    };

    const getInterval = (schedule: string) => {
        const index = schedule.lastIndexOf(":");
        if (index > -1) {
            const sub = schedule.substring(index + 1, schedule.length + 1);
            const interval = Number.parseInt(sub);
            if (!isNaN(interval)) return (interval / 1000).toString();
            return sub;
        }
        return "0";
    };

    const hostTypeInputRef = React.useRef<HTMLInputElement>();
    const handleBrowseHostTypes = async () => {
        const dlg = new HostTypeSelectionDialog(hostTypes);
        const hostType = await dlg.open();
        if (hostType) {
            context.setFieldValue("host", hostType.host);
            context.setFieldValue("port", hostType.port);
            context.setFieldValue("username",
                HostType.isValidUsername(context.values.username, hostType) ?
                    context.values.username :
                    HostType.convertUsername(context.values.username, hostType)
            );
            context.setFieldValue("ssl", hostType.ssl);
            context.setFieldValue("protocol", hostType.protocol);
            hostTypeInputRef.current?.focus();
        }
    };

    return (
        <Collapsible
            trigger={messages.configuration_title("Email")}
            open={opened}
            onClosing={() => setOpened(false)}
            onOpening={() => setOpened(true)}
        >
            <div
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
                onFocus={handleFocus}
            >
                <FormRow
                    name="host"
                    label={messages.host}
                    tooltip={messages.email_host_tooltip}
                    gridTemplateColumns="1fr max-content"
                >
                    <Field name="host" type="text" className="theia-input" />
                    <input
                        type="button"
                        className="theia-button"
                        value={messages.choose}
                        onClick={handleBrowseHostTypes}
                    />
                </FormRow>
                <FormRow
                    name="port"
                    label={messages.host}
                    tooltip={messages.email_port_tooltip}
                    defaultValue={993}>
                    <Field
                        name="port"
                        type="number"
                        className="theia-input"
                        min="1"
                        max="65535"
                    />
                </FormRow>
                <FormRow
                    name="username"
                    label={messages.username}
                    tooltip={messages.email_username_tooltip}
                >
                    <Field name="username" type="text" className="theia-input" />
                </FormRow>
                <FormRow
                    name="password"
                    label={messages.password}
                    tooltip={messages.email_password_tooltip}
                >
                    <Field name="password" type="password" className="theia-input" />
                </FormRow>
                <FormRow
                    name="schedule"
                    label={messages.email_polling_interval_seconds}
                    tooltip={messages.email_polling_interval_tooltip}
                    defaultValue={1}
                >
                    <Field
                        name="schedule"
                        type="number"
                        className="theia-input"
                        min="1"
                        value={getInterval(context.values.schedule)}
                        onChange={handleScheduleChange}
                    />
                </FormRow>
                <FormRow
                    name="ssl"
                    label="SSL"
                    tooltip={messages.email_ssl_tooltip}
                    defaultValue={false}>
                    <Field name="ssl" type="checkbox" />
                </FormRow>
                <FormRow
                    name="protocol"
                    label={messages.protocol}
                    tooltip={messages.email_protocol_tooltip}
                    defaultValue="imap"
                >
                    <label>
                        <Field name="protocol" type="radio" value="imap" className="theia-input" /> IMAP
                    </label>

                    <label>
                        <Field name="protocol" type="radio" value="pop3" className="theia-input" /> POP3
                    </label>
                </FormRow>
            </div>
        </Collapsible>
    );
};

const EmailActionsSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<EmailEndpoint>();
    return (
        <Collapsible
            trigger={messages.email_actions}
            open={opened}
            onClosing={() => setOpened(false)}
            onOpening={() => setOpened(true)}
        >
            <div
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
                onFocus={handleFocus}
            >
                <FormRow
                    name="deleteOnReceive"
                    label={messages.delete_email_once_received}
                    tooltip={messages.email_deleteOnReceive_tooltip}
                >
                    <Field name="deleteOnReceive" type="checkbox" />
                </FormRow>
                <FormRow
                    name="sendOutputAsReply"
                    label={messages.send_service_response_as_reply}
                    tooltip={messages.email_sendOutputAsReply_tooltip}
                >
                    <Field name="sendOutputAsReply" type="checkbox" />
                </FormRow>
                <FormRow
                    name="sendReplyOnError"
                    label={messages.send_reply_on_error}
                    tooltip={messages.email_sendReplyOnError_tooltip}
                >
                    <Field name="sendReplyOnError" type="checkbox" />
                </FormRow>
            </div>
            {(context.values.sendOutputAsReply || context.values.sendReplyOnError) && <EmailReplySettings />}
        </Collapsible>
    );
};

const EmailReplySettings: React.FC = () => {
    const context = useFormikContext<EmailEndpoint>();
    const hostTypeInputRef = React.useRef<HTMLInputElement>();
    const handleBrowseHostType = async () => {
        const dlg = new HostTypeSelectionDialog(replyHostTypes);
        const hostType = await dlg.open();
        if (hostType) {
            context.setFieldValue("replyEmailSettings.host", hostType.host);
            context.setFieldValue("replyEmailSettings.port", hostType.port);
            context.setFieldValue("replyEmailSettings.username",
                HostType.isValidUsername(context.values.replyEmailSettings.username, hostType) ?
                    context.values.replyEmailSettings.username :
                    HostType.convertUsername(context.values.replyEmailSettings.username, hostType)
            );
            context.setFieldValue("replyEmailSettings.ssl", hostType.ssl);
            context.setFieldValue("replyEmailSettings.from", hostType.from);
            hostTypeInputRef.current?.focus();
        }
    };
    return (
        <div
            style={{
                display: "grid",
                gridColumnGap: 10,
                gridTemplateColumns: "max-content 1fr",
                margin: "0px 12px"
            }}
        >
            <FormRow
                name="replyEmailSettings.host"
                label={messages.host}
                tooltip={messages.email_port_tooltip}
                gridTemplateColumns="1fr max-content"
            >
                <Field name="replyEmailSettings.host" type="text" className="theia-input" />
                <input
                    type="button"
                    className="theia-button"
                    value={messages.choose}
                    onClick={handleBrowseHostType}
                />
            </FormRow>
            <FormRow
                name="replyEmailSettings.port"
                label={messages.port}
                tooltip={messages.email_port_tooltip}
                defaultValue={993}
            >
                <Field name="replyEmailSettings.port" type="number" className="theia-input" />
            </FormRow>
            <FormRow
                name="replyEmailSettings.username"
                label={messages.username}
                tooltip={messages.email_username_tooltip}
            >
                <Field name="replyEmailSettings.username" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="replyEmailSettings.password"
                label={messages.password}
                tooltip={messages.email_password_tooltip}
            >
                <Field name="replyEmailSettings.password" type="password" className="theia-input" />
            </FormRow>
            <FormRow
                name="replyEmailSettings.from"
                label={messages.from}
                tooltip={messages.email_from_tooltip}
            >
                <Field name="replyEmailSettings.from" type="text" className="theia-input" />
            </FormRow>
            <FormRow name="replyEmailSettings.ssl" label="SSL/TLS" tooltip={messages.email_ssl_tooltip}>
                <Field name="replyEmailSettings.ssl" type="checkbox" />
            </FormRow>
        </div>
    );
};
