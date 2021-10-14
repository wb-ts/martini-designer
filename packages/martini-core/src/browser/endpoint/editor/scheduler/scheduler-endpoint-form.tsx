import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import { CronSettings, MartiniEndpoint, SchedulerEndpoint, SimpleRepeatingSettings } from "../../../../common/endpoint/martini-endpoint-manager";
import { DocumentType } from "../../../../common/tracker/document-type-manager";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";
import "../../../yup/yup-ext";
import { GeneralConfigurationSection, generalSchema } from "../general-config-section";

export interface SchedulerEndpointFormProps {
    endpoint: MartiniEndpoint;
    reset: boolean;
    documentTypeProvider: () => Promise<DocumentType[]>;
    onChange: (connection: MartiniEndpoint) => void;
    onValidate: (errors: FormikErrors<MartiniEndpoint>) => void;
}
export const SchedulerEndpointForm: React.FC<SchedulerEndpointFormProps> = ({
    endpoint,
    reset,
    documentTypeProvider,
    onChange,
    onValidate
}) => {
    const schema = React.useMemo(
        () =>
            Yup.object()
                .shape<Partial<SchedulerEndpoint>>({
                    cronSettings: Yup.object<CronSettings>().when(["schedulerType"], {
                        is: (schedulerType) => "cron",
                        then: Yup.object().shape<Partial<CronSettings>>({
                            months: Yup.string().required(),
                            weekdays: Yup.string().required(),
                            days: Yup.string().required(),
                            hours: Yup.string().required(),
                            minutes: Yup.string().required(),
                            seconds: Yup.string().required()
                        }),
                    }),
                    simpleRepeatingSettings: Yup.object<SimpleRepeatingSettings>().when(["scheduler"], {
                        is: (schedulerType) => "simpleRepeating",
                        then: Yup.object().shape<Partial<SimpleRepeatingSettings>>({
                            interval: Yup.number().required()
                        })
                    })
                })
                .concat(generalSchema),
        []
    );

    const validate = async (endpoint: SchedulerEndpoint) => validateSchema(schema, endpoint, onValidate);

    return (
        <Formik
            initialValues={endpoint}
            initialTouched={{
                scheduleType: true,
                stateful: true,
                cronSettings: {
                    dayType: true,
                    months: true,
                    weekdays: true,
                    days: true,
                    hours: true,
                    minutes: true,
                    seconds: true
                },
                simpleRepeatingSettings: {
                    interval:true
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
                <SchedulerConfigurationSection />
            </Form>
        </Formik>
    );
};
const SchedulerConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<SchedulerEndpoint>();
    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const interval = Number.parseInt(e.currentTarget.value);
        context.setFieldValue("simpleRepeatingSettings.interval", interval);
    };
    return (
        <Collapsible
            trigger={messages.configuration_title("Scheduler")}
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
                    name="scheduleType"
                    label={messages.type}
                    tooltip={messages.scheduler_schedule_type_tooltip}
                >
                    <label>
                        <Field name="scheduleType" type="radio" value="simpleRepeating" className="theia-input" /> Simple Repeating
                    </label>

                    <label>
                        <Field name="scheduleType" type="radio" value="cron" className="theia-input" /> Cron
                    </label>
                </FormRow>
                <FormRow
                    name="stateful"
                    label={messages.stateful}
                >
                    <Field name="stateful" type="checkbox" className="theia-input"></Field>
                </FormRow>
            </div>
            <div
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
            >
                {context.values.scheduleType == "simpleRepeating" && (
                    <FormRow
                        name="simpleRepeatingSettings.interval"
                        label={messages.scheduler_polling_interval_seconds}
                    >
                        <Field
                            name="simpleRepeatingSettings.interval"
                            type="number"
                            className="theia-input"
                            min="1"
                            value={context.values.simpleRepeatingSettings.interval}
                            onChange={handleScheduleChange}
                        />
                    </FormRow>
                )}

                {context.values.scheduleType == "cron" && (
                    <FormRow
                        name="cronSettings.cronDayType"
                        label="Type"
                        tooltip={messages.scheduler_schedule_type_tooltip}
                    >
                        <label>
                            <Field name="cronSettings.dayType" type="radio" value="weekday" className="theia-input" />{" "}
                            Day Of Week
                        </label>

                        <label>
                            <Field name="cronSettings.dayType" type="radio" value="monthday" className="theia-input" />{" "}
                            Day of Month
                        </label>
                    </FormRow>
                )}
            </div>
        </Collapsible>
    );
};
