import { RecursivePartial } from "@theia/core";
import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop, pullAt, startCase } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import {
    CassandraCompression,
    CassandraConsistencyLevel, CassandraDatabaseConnection
} from "../../../../common/database-connection/martini-database-connection-manager";
import { isValidUrl } from "../../../../common/fs/file-util";
import { JAVA_INTEGER_MAX_VALUE } from "../../../../common/util/java";
import { TextCellEditor } from "../../../components/cell-editors";
import { TableEditor, TableEditorColumn } from "../../../components/table-editor";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";
import { generateUnique } from "../../../../common/util/string";
import "../../../yup/yup-ext";

export interface CassandraConnectionFormProps {
    connection: CassandraDatabaseConnection;
    reset: boolean;
    onChange: (connection: CassandraDatabaseConnection) => void;
    onValidate: (errors: FormikErrors<CassandraDatabaseConnection>) => void;
}

export const CassandraConnectionForm: React.FC<CassandraConnectionFormProps> = ({
    connection,
    reset,
    onChange,
    onValidate
}) => {
    const schema = React.useMemo(() => Yup.object().shape<RecursivePartial<CassandraDatabaseConnection>>({
        port: Yup.number()
            .min(1)
            .max(65535)
            .required(),
        contactPoints: Yup.array()
            .of(Yup.string().url().required())
            .required(messages.cassandra_contact_points_should_not_be_empty),
        maxSchemaAgreementWaitSeconds: Yup.number()
            .integer()
            .min(0)
            .max(JAVA_INTEGER_MAX_VALUE),
        poolingOptions: Yup.object().shape<Partial<CassandraDatabaseConnection["poolingOptions"]>>({
            coreConnectionsPerHostLocal: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            coreConnectionsPerHostRemote: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxConnectionsPerHostLocal: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxConnectionsPerHostRemote: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            newConnectionThresholdLocal: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            newConnectionThresholdRemote: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxRequestsPerConnectionLocal: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxRequestsPerConnectionRemote: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            idleTimeoutSeconds: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            poolTimeoutMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxQueueSize: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            heartbeatIntervalSeconds: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE)
        }),
        socketOptions: Yup.object().shape<Partial<CassandraDatabaseConnection["socketOptions"]>>({
            connectTimeoutMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            readTimeoutMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            soLinger: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            receiveBufferSize: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            sendBufferSize: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE)
        }),
        queryOptions: Yup.object().shape<Partial<CassandraDatabaseConnection["queryOptions"]>>({
            fetchSize: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            refreshSchemaIntervalMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxPendingRefreshSchemaRequests: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            refreshNodeListIntervalMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxPendingRefreshNodeListRequests: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE),
            refreshNodeIntervalMillis: Yup.number()
                .integer()
                .min(0)
                .max(JAVA_INTEGER_MAX_VALUE),
            maxPendingRefreshNodeRequests: Yup.number()
                .integer()
                .min(1)
                .max(JAVA_INTEGER_MAX_VALUE)
        })
    }), []);

    const validate = (connection: CassandraDatabaseConnection) => validateSchema(schema, connection, onValidate);

    return (
        <Formik<CassandraDatabaseConnection>
            initialValues={connection}
            initialTouched={{
                port: true,
                contactPoints: true,
                maxSchemaAgreementWaitSeconds: true,
                poolingOptions: {
                    coreConnectionsPerHostLocal: true,
                    coreConnectionsPerHostRemote: true,
                    maxConnectionsPerHostLocal: true,
                    maxConnectionsPerHostRemote: true,
                    newConnectionThresholdLocal: true,
                    newConnectionThresholdRemote: true,
                    maxRequestsPerConnectionLocal: true,
                    maxRequestsPerConnectionRemote: true,
                    idleTimeoutSeconds: true,
                    poolTimeoutMillis: true,
                    maxQueueSize: true,
                    heartbeatIntervalSeconds: true
                },
                socketOptions: {
                    connectTimeoutMillis: true,
                    readTimeoutMillis: true,
                    soLinger: true,
                    receiveBufferSize: true,
                    sendBufferSize: true
                },
                queryOptions: {
                    fetchSize: true,
                    refreshSchemaIntervalMillis: true,
                    maxPendingRefreshSchemaRequests: true,
                    refreshNodeListIntervalMillis: true,
                    maxPendingRefreshNodeListRequests: true,
                    refreshNodeIntervalMillis: true,
                    maxPendingRefreshNodeRequests: true
                }
            }}
            enableReinitialize={reset}
            validate={validate}
            validateOnMount={true}
            onSubmit={noop}
        >
            <Form>
                <OnFormChange onChange={onChange} />
                <GeneralConfigurationSection />
                <AdvancedConfigurationSection />
                <PoolingConfigurationSection />
                <SocketConfigurationSection />
                <QueryConfigurationSection />
            </Form>
        </Formik>
    );
};

interface ContactPointsTableProps {
    contactPoints: string[];
    onAdd?: () => Promise<boolean>;
    onDelete?: (rows: number[]) => Promise<boolean>;
    onEdit?: (index: number, value: string) => void;
}

const ContactPointsTable: React.FC<ContactPointsTableProps> = ({ contactPoints, onAdd, onDelete, onEdit }) => {
    const validate = (oldValue: string, newValue: string) => {
        if (contactPoints.includes(newValue) && newValue !== oldValue)
            return messages.cassandra_contact_point_name_exists;
        if (!isValidUrl(newValue))
            return messages.invalid_url;
        return undefined;
    };
    const column: TableEditorColumn<string> = {
        accessor: "contactPoint",
        id: "contactPoint",
        cellEditor: props => <TextCellEditor {...props}
            editor={{
                ...props.editor,
                validate: newValue => validate(props.editor.value, newValue)
            }}
            minLength={1}
            autoFocus={true}
        />
    };

    const handleEdit = async (rowIndex: number, columnId: string, value: any) => {
        if (onEdit)
            onEdit(rowIndex, value as string);
    };

    return (
        <TableEditor
            style={{
                minHeight: "150px",
                height: "150px"
            }}
            tableProps={{
                data: contactPoints.map(contactPoint => ({ contactPoint })),
                columns: [column],
                showTableHeader: false
            }}
            onAdd={onAdd}
            onDelete={onDelete}
            onEdit={handleEdit}
        />
    );
};

const GeneralConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<CassandraDatabaseConnection>();

    const handleAddContactPoint = async () => {
        context.setFieldValue("contactPoints", [...context.values.contactPoints, generateUnique(context.values.contactPoints, "name")]);
        return true;
    };
    const handleDeleteContactPoint = async (indexes: number[]) => {
        const contactPoints = [...context.values.contactPoints];
        pullAt(contactPoints, indexes);
        context.setFieldValue("contactPoints", contactPoints);
        return true;
    };
    const handleEditContactPoint = async (index: number, value: string) => {
        const contactPoints = [...context.values.contactPoints];
        contactPoints[index] = value;
        context.setFieldValue("contactPoints", contactPoints);
    };

    return (
        <Collapsible
            trigger={messages.general_config_title}
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
                <FormRow name="name" label="Name">
                    <Field name="name" type="text" className="theia-input" readOnly />
                </FormRow>
                <FormRow name="port" label="Port">
                    <Field name="port" type="number" className="theia-input" />
                </FormRow>
                <FormRow name="ssl" label="SSL">
                    <Field name="ssl" type="checkbox" />
                </FormRow>
                <FormRow name="url" label="URL">
                    <Field name="url" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="credentials.username" label="Username" tooltip={messages.connection_username_tooltip}>
                    <Field name="credentials.username" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="credentials.password" label="Password" tooltip={messages.connection_password_tooltip}>
                    <Field name="credentials.password" type="password" className="theia-input" />
                </FormRow>
                <FormRow name="autoStart" label="Auto Start">
                    <Field name="autoStart" type="checkbox" />
                </FormRow>
                <FormRow name="contactPoints" label="Contact Points" tooltip={messages.cassandra_contact_points_tooltip}>
                    <ContactPointsTable
                        contactPoints={context.values.contactPoints}
                        onAdd={handleAddContactPoint}
                        onDelete={handleDeleteContactPoint}
                        onEdit={handleEditContactPoint}
                    />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const AdvancedConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.advanced)}
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
                    name="maxSchemaAgreementWaitSeconds"
                    label="Max Schema Agreement Wait (seconds)"
                    tooltip={messages.cassandra_max_schema_agreement_wait_seconds_tooltip}
                >
                    <Field name="maxSchemaAgreementWaitSeconds" type="number" className="theia-input" />
                </FormRow>
                <FormRow name="compression" label="Compression" tooltip={messages.cassandra_compression_tooltip}>
                    <Field name="compression" as="select" className="theia-select">
                        {Object.values(CassandraCompression).map(compression => (
                            <option key={compression} value={compression}>
                                {startCase(compression.toLowerCase())}
                            </option>
                        ))}
                    </Field>
                </FormRow>
                <FormRow name="metrics" label="Metrics" tooltip={messages.cassandra_metrics_tooltip}>
                    <Field name="metrics" type="checkbox" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const PoolingConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.pooling)}
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
                    name="poolingOptions.coreConnectionsPerHostLocal"
                    label="Core Connections Per Host Local"
                    tooltip={messages.cassandra_core_connections_per_host_local_tooltip}
                >
                    <Field name="poolingOptions.coreConnectionsPerHostLocal" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.coreConnectionsPerHostRemote"
                    label="Core Connections Per Host Remote"
                    tooltip={messages.cassandra_core_connections_per_host_remote_tooltip}
                >
                    <Field name="poolingOptions.coreConnectionsPerHostRemote" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.maxConnectionsPerHostLocal"
                    label="Max Connections Per Host Local"
                    tooltip={messages.cassandra_max_connections_per_host_local_tooltip}
                >
                    <Field name="poolingOptions.maxConnectionsPerHostLocal" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.maxConnectionsPerHostRemote"
                    label="Max Connections Per Host Remote"
                    tooltip={messages.cassandra_max_connections_per_host_remote_tooltip}
                >
                    <Field name="poolingOptions.maxConnectionsPerHostRemote" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.newConnectionThresholdLocal"
                    label="New Connection Threshold Local"
                    tooltip={messages.cassandra_new_connection_threshold_local_tooltip}
                >
                    <Field name="poolingOptions.newConnectionThresholdLocal" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.newConnectionThresholdRemote"
                    label="New Connection Threshold Remote"
                    tooltip={messages.cassandra_new_connection_threshold_remote_tooltip}
                >
                    <Field name="poolingOptions.newConnectionThresholdRemote" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.maxRequestsPerConnectionLocal"
                    label="Max Requests Per Connection Local"
                    tooltip={messages.cassandra_max_requests_per_connection_local_tooltip}
                >
                    <Field name="poolingOptions.maxRequestsPerConnectionLocal" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.maxRequestsPerConnectionRemote"
                    label="Max Requests Per Connection Remote"
                    tooltip={messages.cassandra_max_requests_per_connection_remote_tooltip}
                >
                    <Field name="poolingOptions.maxRequestsPerConnectionRemote" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.idleTimeoutSeconds"
                    label="Idle Timeout (seconds)"
                    tooltip={messages.cassandra_idle_timeout_tooltip}
                >
                    <Field name="poolingOptions.idleTimeoutSeconds" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.poolTimeoutMillis"
                    label="Pool Timeout (ms)"
                    tooltip={messages.cassandra_pool_timeout_tooltip}
                >
                    <Field name="poolingOptions.poolTimeoutMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.maxQueueSize"
                    label="Max Queue Size"
                    tooltip={messages.cassandra_max_queue_size_tooltip}
                >
                    <Field name="poolingOptions.maxQueueSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="poolingOptions.heartbeatIntervalSeconds"
                    label="Heartbeat Interval (seconds)"
                    tooltip={messages.cassandra_heartbeat_interval_tooltip}
                >
                    <Field name="poolingOptions.heartbeatIntervalSeconds" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const SocketConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.socket)}
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
                    name="socketOptions.connectTimeoutMillis"
                    label="Connect Timeout (ms)"
                    tooltip={messages.cassandra_connect_timeout_tooltip}
                >
                    <Field name="socketOptions.connectTimeoutMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketOptions.readTimeoutMillis"
                    label="Read Timeout (ms)"
                    tooltip={messages.cassandra_read_timeout_tooltip}
                >
                    <Field name="socketOptions.readTimeoutMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketOptions.keepAlive"
                    label="Keep Alive"
                    tooltip={messages.cassandra_keep_alive_tooltip}
                >
                    <Field name="socketOptions.keepAlive" type="checkbox" />
                </FormRow>
                <FormRow
                    name="socketOptions.reuseAddress"
                    label="Reuse Address"
                    tooltip={messages.cassandra_reuse_address_tooltip}
                >
                    <Field name="socketOptions.reuseAddress" type="checkbox" />
                </FormRow>
                <FormRow
                    name="socketOptions.tcpNoDelay"
                    label="TCP No Delay"
                    tooltip={messages.cassandra_tcp_no_delay_tooltip}
                >
                    <Field name="socketOptions.tcpNoDelay" type="checkbox" />
                </FormRow>
                <FormRow
                    name="socketOptions.soLinger"
                    label="So Linger"
                    tooltip={messages.cassandra_so_linger_tooltip}
                >
                    <Field name="socketOptions.soLinger" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketOptions.receiveBufferSize"
                    label="Receive Buffer Size"
                    tooltip={messages.cassandra_receive_buffer_size_tooltip}
                >
                    <Field name="socketOptions.receiveBufferSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketOptions.sendBufferSize"
                    label="Send Buffer Size"
                    tooltip={messages.cassandra_send_buffer_size_tooltip}
                >
                    <Field name="socketOptions.sendBufferSize" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const QueryConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);
    const consistencyLevelOptions = Object.values(CassandraConsistencyLevel).map(level => (
        <option key={level} value={level}>
            {startCase(level.toLowerCase())}
        </option>
    ));

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.query)}
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
                    name="queryOptions.consistencyLevel"
                    label="Consistency Level"
                    tooltip={messages.cassandra_consistency_level_tooltip}
                >
                    <Field name="queryOptions.consistencyLevel" as="select" className="theia-select">
                        {consistencyLevelOptions}
                    </Field>
                </FormRow>
                <FormRow
                    name="queryOptions.serialConsistencyLevel"
                    label="Serial Consistency Level"
                    tooltip={messages.cassandra_serial_consistency_level_tooltip}
                >
                    <Field name="queryOptions.serialConsistencyLevel" as="select" className="theia-select">
                        {consistencyLevelOptions}
                    </Field>
                </FormRow>
                <FormRow
                    name="queryOptions.fetchSize"
                    label="Fetch Size"
                    tooltip={messages.cassandra_fetch_size_tooltip}
                >
                    <Field name="queryOptions.fetchSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="queryOptions.defaultIdempotence"
                    label="Default Idempotence"
                    tooltip={messages.cassandra_default_idempotence_tooltip}
                >
                    <Field name="queryOptions.defaultIdempotence" type="checkbox" />
                </FormRow>
                <FormRow
                    name="queryOptions.prepareOnAllHosts"
                    label="Prepare On All Hosts"
                    tooltip={messages.cassandra_prepare_on_all_hosts_tooltip}
                >
                    <Field name="queryOptions.prepareOnAllHosts" type="checkbox" />
                </FormRow>
                <FormRow
                    name="queryOptions.reprepareOnUp"
                    label="Re-Prepare On Up"
                    tooltip={messages.cassandra_reprepare_on_up_tooltip}
                >
                    <Field name="queryOptions.reprepareOnUp" type="checkbox" />
                </FormRow>
                <FormRow
                    name="queryOptions.refreshSchemaIntervalMillis"
                    label="Refresh Schema Interval (ms)"
                    tooltip={messages.cassandra_refresh_schema_interval_tooltip}
                >
                    <Field name="queryOptions.refreshSchemaIntervalMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="queryOptions.maxPendingRefreshSchemaRequests"
                    label="Max Pending Refresh Schema Requests"
                    tooltip={messages.cassandra_max_pending_refresh_schema_requests_tooltip}
                >
                    <Field name="queryOptions.maxPendingRefreshSchemaRequests" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="queryOptions.refreshNodeListIntervalMillis"
                    label="Refresh Node List Interval (ms)"
                    tooltip={messages.cassandra_refresh_node_list_interval_tooltip}
                >
                    <Field name="queryOptions.refreshNodeListIntervalMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="queryOptions.maxPendingRefreshNodeListRequests"
                    label="Max Pending Refresh NodeList Requests"
                    tooltip={messages.cassandra_max_pending_refresh_node_list_requests_tooltip}
                >
                    <Field
                        name="queryOptions.maxPendingRefreshNodeListRequests"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="queryOptions.refreshNodeIntervalMillis"
                    label="Refresh Node Interval (ms)"
                    tooltip={messages.cassandra_refresh_node_interval_tooltip}
                >
                    <Field name="queryOptions.refreshNodeIntervalMillis" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="queryOptions.maxPendingRefreshNodeRequests"
                    label="Max Pending Refresh Node Requests"
                    tooltip={messages.cassandra_max_pending_refresh_node_requests_tooltip}
                >
                    <Field name="queryOptions.maxPendingRefreshNodeRequests" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};
