import { Field, Form, Formik, FormikErrors, useFormikContext, yupToFormErrors } from "formik";
import { noop, startCase } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import { Driver, JdbcDatabaseConnection, JdbcIsolationLevel } from "../../../../common/database-connection/martini-database-connection-manager";
import { List, ListItem } from "../../../components/list";
import { applySize, BaseDialog } from "../../../dialogs/dialogs";
import { FormErrorMessage, FormErrorMessageWrapper, FormRow, OnFormChange } from "../../../form/form";

export interface JdbcConnectionFormProps {
    connection: JdbcDatabaseConnection;
    reset: boolean;
    driverProvider: () => Promise<Driver[]>;
    onChange: (connection: JdbcDatabaseConnection) => void;
    onValidate: (errors: FormikErrors<JdbcDatabaseConnection>) => void;
}

export const JdbcConnectionForm: React.FC<JdbcConnectionFormProps> = ({
    connection,
    reset,
    driverProvider,
    onChange,
    onValidate,
}) => {
    const schema = React.useMemo(() => Yup.object().shape<any>({
        driverClassName: Yup.string().required(),
        url: Yup.string().required(),
        username: Yup.string().required().min(1).max(20),
        loginTimeout: Yup.number().integer().required().min(0),
        acquireIncrement: Yup.number().integer().required().min(1).max(10),
        acquisitionInterval: Yup.number().integer().required().min(1).max(20),
        acquisitionTimeout: Yup.number().integer().required().min(0).max(60),
        maxIdleTime: Yup.number().integer().required().min(1).max(60),
        minPoolSize: Yup.number().integer().required().min(0),
        maxPoolSize: Yup.number().integer().required().min(1),
        preparedStatementCacheSize: Yup.number().integer().required().min(0),
        twoPcOrderingPosition: Yup.number().integer().required().min(0),
    }), []);

    const validate = async (connection: JdbcDatabaseConnection) => {
        let errors: FormikErrors<JdbcDatabaseConnection> = {};
        try {
            await schema.validate(connection, { abortEarly: false });
        } catch (error) {
            errors = yupToFormErrors(error);
        }
        onValidate(errors);
        return errors;
    };

    return <Formik
        initialValues={connection}
        initialTouched={{
            url: true,
            driverClassName: true,
            username: true,
            acquireIncrement: true,
            acquisitionInterval: true,
            acquisitionTimeout: true,
            maxIdleTime: true,
            minPoolSize: true,
            maxPoolSize: true,
            preparedStatementCacheSize: true,
            testQuery: true,
            twoPcOrderingPosition: true,
            uniqueName: true,
            loginTimeout: true,
        }}
        enableReinitialize={reset}
        validate={validate}
        validateOnMount={true}
        onSubmit={noop}
    >
        <Form>
            <OnFormChange onChange={onChange} />
            <GeneralConfigurationSection driverProvider={driverProvider} />
            <AdvancedConfigurationSection />
        </Form>
    </Formik>;
};


const GeneralConfigurationSection: React.FC<{ driverProvider: () => Promise<Driver[]>; }> = ({ driverProvider }) => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<JdbcDatabaseConnection>();

    const handleBrowseDrivers = async () => {
        const dlg = new DriverSelectionDialog(driverProvider);
        const driver = await dlg.open();
        if (driver) {
            context.setFieldValue("driverClassName", driver.className);

            if (!context.values.url || context.values.url.trim().length === 0)
                context.setFieldValue("url", driver.templateUrl);
        }
    };

    return <Collapsible
        trigger="General Configuration"
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
            <FormRow
                name="driverClassName"
                label="Driver Class"
                showErrorMessage={false}
                gridTemplateColumns="1fr max-content"
            >
                <Field name="driverClassName" type="text" className="theia-input" />
                <input
                    type="button"
                    className="theia-button"
                    value={messages.browse_btn}
                    onClick={handleBrowseDrivers}
                />
                <FormErrorMessageWrapper>
                    <FormErrorMessage name="driverClassName" />
                </FormErrorMessageWrapper>
            </FormRow>
            <FormRow name="url" label="URL">
                <Field name="url" type="text" className="theia-input" />
            </FormRow>
            <FormRow name="username" label="Username">
                <Field name="username" type="text" className="theia-input" />
            </FormRow>
            <FormRow name="password" label="Password">
                <Field name="password" type="password" className="theia-input" />
            </FormRow>
            <FormRow name="xa" label="Use XA" tooltip={messages.use_xa_tooltip}>
                <Field name="xa" type="checkbox" />
            </FormRow>
            <FormRow name="autoStart" label="Auto Start" tooltip={messages.auto_start_tooltip}>
                <Field name="autoStart" type="checkbox" />
            </FormRow>
        </div>
    </Collapsible>;
};

const AdvancedConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);

    return <Collapsible
        trigger="Advanced Configuration"
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
            <FormRow
                name="loginTimeout"
                label="Login Timeout (seconds)"
                defaultValue={0}
            >
                <Field name="loginTimeout" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="acquireIncrement"
                label="Acquire Increment"
                tooltip={messages.acquire_increment_tooltip}
            >
                <Field name="acquireIncrement" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="acquisitionInterval"
                label="Acquisition Interval (seconds)"
                tooltip={messages.acquisition_interval_tooltip}
            >
                <Field name="acquisitionInterval" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="acquisitionTimeout"
                label="Acquisition Timeout (seconds)"
                tooltip={messages.acquisition_timeout_tooltip}
            >
                <Field name="acquisitionTimeout" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="allowLocalTransactions"
                label="Allow Local Transactions"
                tooltip={messages.allow_local_transactions_tooltip}
            >
                <Field name="allowLocalTransactions" type="checkbox" />
            </FormRow>
            <FormRow
                name="applyTransactionTimeout"
                label="Apply XA Transaction Timeout"
                tooltip={messages.apply_transaction_timeout_tooltip}
            >
                <Field name="applyTransactionTimeout" type="checkbox" />
            </FormRow>
            <FormRow
                name="automaticEnlistingEnabled"
                label="Enlist to XA Automatically"
                tooltip={messages.automatic_enlisting_tooltip}
            >
                <Field name="automaticEnlistingEnabled" type="checkbox" />
            </FormRow>
            <FormRow
                name="deferConnectionRelease"
                label="Defer Connection Release"
                tooltip={messages.defer_connection_release_tooltip}
            >
                <Field name="deferConnectionRelease" type="checkbox" />
            </FormRow>
            <FormRow
                name="enableJdbc4ConnectionTest"
                label="Enable JDBC4 Connection Test"
                tooltip={messages.enabled_jdbc4_connection_test_tooltip}
            >
                <Field name="enableJdbc4ConnectionTest" type="checkbox" />
            </FormRow>
            <FormRow
                name="ignoreRecoveryFailures"
                label="Ignore Recovery Failures"
                tooltip={messages.ignore_recovery_failures_tooltip}
            >
                <Field name="ignoreRecoveryFailures" type="checkbox" />
            </FormRow>
            <FormRow
                name="maxIdleTime"
                label="Maximum Idle Time (seconds)"
                tooltip={messages.max_idle_time_tooltip}
            >
                <Field name="maxIdleTime" type="text" className="theia-input" />
            </FormRow>
            <FormRow name="isolationLevel" label="Isolation Level">
                <Field name="isolationLevel" as="select" className="theia-select">
                    {Object.values(JdbcIsolationLevel)
                        .map(level =>
                            (<option key={level} value={level}>{startCase(level.toLowerCase())}</option>))}
                </Field>
            </FormRow>
            <FormRow
                name="minPoolSize"
                label="Minimum Pool Size"
                tooltip={messages.min_pool_size_tooltip}
            >
                <Field name="minPoolSize" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="maxPoolSize"
                label="Maximum Pool Size"
                tooltip={messages.max_pool_size_tooltip}
            >
                <Field name="maxPoolSize" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="preparedStatementCacheSize"
                label="Prepared Statement Cache Size"
                tooltip={messages.statements_cache_size_tooltip}
            >
                <Field name="preparedStatementCacheSize" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="shareTransactionConnections"
                label="Share Transaction Connections"
                tooltip={messages.share_transaction_connection_tooltip}
            >
                <Field name="shareTransactionConnections" type="checkbox" />
            </FormRow>
            <FormRow
                name="twoPcOrderingPosition"
                label="Two-Phase Commit Order Position"
                tooltip={messages.two_phase_commit_order_position_tooltip}
            >
                <Field name="twoPcOrderingPosition" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="uniqueName"
                label="Unique Name"
                tooltip={messages.unique_name_tooltip}
            >
                <Field name="uniqueName" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="useTmJoin"
                label="Use Transaction Manager Join"
                tooltip={messages.use_trans_manager_join_tooltip}
            >
                <Field name="useTmJoin" type="checkbox" />
            </FormRow>
            <FormRow
                name="uniqueName"
                label="Unique Name"
                tooltip={messages.unique_name_tooltip}
            >
                <Field name="uniqueName" type="text" className="theia-input" />
            </FormRow>
            <FormRow
                name="testQuery"
                label="Test Query"
                tooltip={messages.test_query_tooltip}
            >
                <Field name="testQuery" as="textarea" className="theia-input" />
            </FormRow>
        </div>
    </Collapsible >;
};

export class DriverSelectionDialog extends BaseDialog<Driver> {

    value: Driver;
    private drivers: Driver[] = [];

    constructor(driverProvider: () => Promise<Driver[]>) {
        super({
            title: messages.select_driver_title
        });
        applySize(this.contentNode, {
            height: 200
        });

        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.select_btn);

        setTimeout(() => {
            this.showProgress(messages.fetching_drivers, async () => {
                this.drivers = await driverProvider();
                this.value = this.drivers[0];
            });
        });
    }

    protected doRender(): React.ReactNode {
        const items: ListItem[] = this.drivers.map((driver, i) => ({
            label: driver.name,
            tooltip:
                `Class: ${driver.className}
XA Class: ${driver.xaClassName}
Template URL: ${driver.templateUrl}
`,
            data: driver,
            selected: i === 0
        }));
        return <List
            items={items}
            filtered={true}
            style={{ height: "100%" }}
            focus={true}
            onSelectionChanged={selection => {
                this.value = selection.data;
                this.validate();
            }}
            onDoubleClick={() => this.accept()}
        />;
    }
}
