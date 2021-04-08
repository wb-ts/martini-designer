import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import { MartiniEndpoint, RssEndpoint } from "../../../../common/endpoint/martini-endpoint-manager";
import { DocumentType } from "../../../../common/tracker/document-type-manager";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";
import "../../../yup/yup-ext";
import { GeneralConfigurationSection, generalSchema } from "../general-config-section";

export interface RssEndpointFormProps {
    endpoint: MartiniEndpoint;
    reset: boolean;
    documentTypeProvider: () => Promise<DocumentType[]>;
    onChange: (connection: MartiniEndpoint) => void;
    onValidate: (errors: FormikErrors<MartiniEndpoint>) => void;
}

export const RssEndpointForm: React.FC<RssEndpointFormProps> = ({
    endpoint,
    reset,
    documentTypeProvider,
    onChange,
    onValidate,
}) => {
    const schema = React.useMemo(() => Yup.object().shape<Partial<RssEndpoint>>({
        rssUrl: Yup.string()
            .required()
            .url(),
        schedule: Yup.string()
            .required()
            .test(
                "is-positive-integer",
                messages.must_be_greater_or_equal(1),
                value => {
                    if (value) {
                        const index = value.lastIndexOf(":");
                        if (index > -1) {
                            const sub = value.substring(index + 1, value.length + 1);
                            const interval = Number.parseInt(sub);
                            if (!isNaN(interval) && interval > 0)
                                return true;
                        }
                    }

                    return false;
                })
    }).concat(generalSchema), []);

    const validate = async (endpoint: RssEndpoint) => validateSchema(schema, endpoint, onValidate);

    return <Formik
        initialValues={endpoint}
        initialTouched={{
            rssUrl: true,
            schedule: true
        }}
        enableReinitialize={reset}
        validate={validate}
        validateOnMount={true}
        onSubmit={noop}
    >
        <Form>
            <OnFormChange onChange={onChange} />
            <GeneralConfigurationSection documentTypeProvider={documentTypeProvider} />
            <RssConfigurationSection />
        </Form>
    </Formik>;
};

const RssConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<RssEndpoint>();
    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const interval = Number.parseInt(e.currentTarget.value);
        if (isNaN(interval))
            context.setFieldValue("schedule", `repeating:${e.currentTarget.value}`);
        else
            context.setFieldValue("schedule", `repeating:${interval * 1000}`);
    };
    const getInterval = (schedule: string) => {
        const index = schedule.lastIndexOf(":");
        if (index > -1) {
            const sub = schedule.substring(index + 1, schedule.length + 1);
            const interval = Number.parseInt(sub);
            if (!isNaN(interval))
                return (interval / 1000).toString();
            return sub;
        }
        return "0";
    };
    return <Collapsible
        trigger={messages.configuration_title("RSS")}
        open={opened}
        onClosing={() => setOpened(false)}
        onOpening={() => setOpened(true)}
    >
        <div
            style={{
                display: "grid",
                gridColumnGap: 10,
                gridTemplateColumns: "max-content 1fr",
            }}
            onFocus={handleFocus}
        >
            <FormRow name="rssUrl" label="URL" tooltip={messages.rss_url_tooltip}>
                <Field name="rssUrl" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="schedule"
                label={messages.rss_polling_interval_field}
                tooltip={messages.rss_polling_interval_tooltip}
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
                name="onlyNew"
                label={messages.rss_only_new_field}
                tooltip={messages.rss_only_new_tooltip}
            >
                <Field name="onlyNew" type="checkbox" />
            </FormRow>
        </div>
    </Collapsible>;
};
