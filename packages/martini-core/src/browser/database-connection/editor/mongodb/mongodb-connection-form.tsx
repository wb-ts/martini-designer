import { RecursivePartial } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop, pullAt, startCase } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import {
    MongoDbAuthenticationMechanism,
    MongoDbClusterType, MongoDbDatabaseConnection
} from "../../../../common/database-connection/martini-database-connection-manager";
import { JAVA_INTEGER_MAX_VALUE } from "../../../../common/util/java";
import { generateUnique } from "../../../../common/util/string";
import { TextCellEditor } from "../../../components/cell-editors";
import { TableEditor, TableEditorColumn } from "../../../components/table-editor";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";

export interface MongoDbConnectionFormProps {
    connection: MongoDbDatabaseConnection;
    reset: boolean;
    onChange: (connection: MongoDbDatabaseConnection) => void;
    onValidate: (errors: FormikErrors<MongoDbDatabaseConnection>) => void;
}

export const MongoDbConnectionForm: React.FC<MongoDbConnectionFormProps> = ({
    connection,
    reset,
    onChange,
    onValidate
}) => {
    const schema = React.useMemo(
        () =>
            Yup.object().shape<RecursivePartial<MongoDbDatabaseConnection>>({
                connectionString: Yup.string()
                    .test(
                        "valid-connection-string",
                        messages.mongodb_connection_string_must_start_with_mongodb,
                        (connectionString: string) =>
                            connectionString.length === 0 ||
                            connectionString.startsWith("mongodb://") ||
                            connectionString.startsWith("mongodb+srv://")
                    )
                    .test(
                        "hosts-not-empty",
                        messages.mongodb_connection_string_and_hosts_cannot_be_both_empty,
                        function (connectionString) {
                            return !!connectionString || this.parent.clusterSettings.hosts?.length > 0;
                        }
                    ),
                clusterSettings: Yup.object().shape<Partial<MongoDbDatabaseConnection["clusterSettings"]>>({
                    hosts: Yup.array<string>().test(
                        "connection-string-not-empty",
                        messages.mongodb_connection_string_and_hosts_cannot_be_both_empty,
                        function (hosts) {
                            return (
                                !!hosts?.length ||
                                // @ts-ignore
                                this.from[1].value.connectionString
                            );
                        }
                    ),
                    localThreshold: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    serverSelectionTimeout: Yup.number()
                        .integer()
                        .min(-1)
                        .max(JAVA_INTEGER_MAX_VALUE)
                }),
                connectionPoolSettings: Yup.object().shape<
                    Partial<MongoDbDatabaseConnection["connectionPoolSettings"]>
                >({
                    maintenanceFrequency: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    maintenanceInitialDelay: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    maxConnectionIdleTime: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    maxConnectionLifeTime: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    maxWaitTime: Yup.number()
                        .integer()
                        .min(-1)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    maxWaitQueueSize: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    minSize: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE)
                        .test("lt-max-size", messages.mongodb_min_size_cannot_be_gte_max_size, function (minSize: number) {
                            return minSize < this.parent.maxSize;
                        }),
                    maxSize: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE)
                        .test("gt-min-size", messages.mongodb_max_size_cannot_be_lte_min_size, function (maxSize: number) {
                            return maxSize > this.parent.minSize;
                        })
                }),
                serverSettings: Yup.object().shape<Partial<MongoDbDatabaseConnection["serverSettings"]>>({
                    heartbeatFrequency: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    minHeartbeatFrequency: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE)
                }),
                socketSettings: Yup.object().shape<Partial<MongoDbDatabaseConnection["socketSettings"]>>({
                    connectTimeout: Yup.number()
                        .integer()
                        .min(0)
                        .max(JAVA_INTEGER_MAX_VALUE),
                    readTimeout: Yup.number()
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
                })
            }),
        []
    );

    const validate = (connection: MongoDbDatabaseConnection) => validateSchema(schema, connection, onValidate);

    return (
        <Formik<MongoDbDatabaseConnection>
            initialValues={connection}
            initialTouched={{
                connectionString: true,
                clusterSettings: {
                    hosts: true,
                    localThreshold: true,
                    serverSelectionTimeout: true
                },
                connectionPoolSettings: {
                    maintenanceFrequency: true,
                    maintenanceInitialDelay: true,
                    maxConnectionIdleTime: true,
                    maxConnectionLifeTime: true,
                    maxWaitTime: true,
                    maxWaitQueueSize: true,
                    maxSize: true,
                    minSize: true
                },
                serverSettings: {
                    heartbeatFrequency: true,
                    minHeartbeatFrequency: true
                },
                socketSettings: {
                    connectTimeout: true,
                    readTimeout: true,
                    receiveBufferSize: true,
                    sendBufferSize: true
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
                <ClusterConfigurationSection />
                <ConnectionPoolConfigurationSection />
                <ServerConfigurationSection />
                <SocketConfigurationSection />
            </Form>
        </Formik>
    );
};

const GeneralConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);

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
                <FormRow name="connectionString" label="Connection String" tooltip={messages.mongodb_connection_string_tooltip}>
                    <Field name="connectionString" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="username" label="Username" tooltip={messages.connection_username_tooltip}>
                    <Field name="username" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="password" label="Password" tooltip={messages.connection_password_tooltip}>
                    <Field name="password" type="password" className="theia-input" />
                </FormRow>
                <FormRow
                    name="authenticationMechanism"
                    label="Authentication Mechanism"
                    tooltip={messages.mongodb_authentication_mechanism_tooltip}
                >
                    <Field name="authenticationMechanism" as="select" className="theia-select">
                        {Object.values(MongoDbAuthenticationMechanism).map(authMechanism => {
                            let label: string;
                            switch (authMechanism) {
                                case MongoDbAuthenticationMechanism.SCRAM_SHA_1:
                                case MongoDbAuthenticationMechanism.SCRAM_SHA_256:
                                    label = authMechanism.replace(/_/g, "-");
                                    break;
                                default:
                                    label = startCase(authMechanism.toLowerCase());
                            }

                            return (
                                <option key={authMechanism} value={authMechanism}>
                                    {label}
                                </option>
                            );
                        })}
                    </Field>
                </FormRow>
                <FormRow
                    name="authenticationDatabase"
                    label="Authentication Database"
                    tooltip={messages.mongodb_authentication_database_tooltip}
                >
                    <Field name="authenticationDatabase" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="autoStart" label="Auto Start" tooltip={messages.auto_start_tooltip}>
                    <Field name="autoStart" type="checkbox" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

interface HostsTableProps {
    hosts: string[];
    onAdd?: () => Promise<boolean>;
    onDelete?: (rows: number[]) => Promise<boolean>;
    onEdit?: (index: number, value: string) => void;
}

const toSocketAddresses = (value: string): { host: string, port?: number; }[] => {
    if (value.startsWith("mongodb://"))
        value = value.substring(10, value.length);
    if (value.startsWith("mongodb+srv://"))
        value = value.substring(14, value.length);

    return value.split(",").map(value => {
        const uri = new URI("mongodb://" + value);
        const tokens = uri.authority.split(":");

        if (tokens.length === 2)
            return { host: tokens[0], port: Number.parseInt(tokens[1]) };

        return { host: uri.authority, port: -1 };
    });
};

const HostsTable: React.FC<HostsTableProps> = ({ hosts, onAdd, onDelete, onEdit }) => {
    const validate = (oldValue: string, newValue: string) => {
        if (newValue === oldValue)
            return undefined;
        const addresses = toSocketAddresses(newValue);
        if (addresses.find(addr => !Number.isInteger(addr.port)))
            return messages.invalid_url;
        if (addresses.find(addr => !!addr.port && (addr.port < 0 || addr.port > 0xFFFF)))
            return messages.port_out_range;
        if (newValue !== oldValue && hosts.find(host => addresses.find(addr => host === `${addr.host}:${addr.port}`)))
            return messages.mongodb_duplicate_host;
        return undefined;
    };
    const column: TableEditorColumn<string> = {
        accessor: "host",
        id: "host",
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
                data: hosts.map(host => ({ host })),
                columns: [column],
                showTableHeader: false
            }}
            onAdd={onAdd}
            onDelete={onDelete}
            onEdit={handleEdit}
        />
    );
};

const ClusterConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<MongoDbDatabaseConnection>();

    const handleAddHost = async () => {
        context.setFieldValue(
            "clusterSettings.hosts",
            [...context.values.clusterSettings.hosts, generateUnique(context.values.clusterSettings.hosts, "hostname:1")]
        );
        return true;
    };
    const handleDeleteHost = async (indexes: number[]) => {
        const hosts = [...context.values.clusterSettings.hosts];
        pullAt(hosts, indexes);
        context.setFieldValue("clusterSettings.hosts", hosts);
        return true;
    };
    const handleEditHost = async (index: number, value: string) => {
        const hosts = [...context.values.clusterSettings.hosts];
        const newHosts = toSocketAddresses(value).map(addr => `${addr.host}:${addr.port}`);
        hosts.splice(index, 1, ...newHosts);
        context.setFieldValue("clusterSettings.hosts", hosts);
    };

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.cluster)}
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
                <FormRow name="clusterSettings.hosts" label="Hosts" tooltip={messages.mongodb_hosts_tooltip}>
                    <HostsTable
                        hosts={context.values.clusterSettings.hosts}
                        onAdd={handleAddHost}
                        onDelete={handleDeleteHost}
                        onEdit={handleEditHost}
                    />
                </FormRow>
                <FormRow name="clusterSettings.type" label="Type" tooltip={messages.mongodb_type_tooltip}>
                    <Field name="clusterSettings.type" as="select" className="theia-select">
                        {Object.values(MongoDbClusterType).map(type => (
                            <option key={type} value={type}>
                                {startCase(type.toLowerCase())}
                            </option>
                        ))}
                    </Field>
                </FormRow>
                <FormRow
                    name="clusterSettings.localThreshold"
                    label="Local Threshold (ms)"
                    tooltip={messages.mongodb_local_threshold_tooltip}
                >
                    <Field name="clusterSettings.localThreshold" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clusterSettings.serverSelectionTimeout"
                    label="Server Selection Timeout (ms)"
                    tooltip={messages.mongodb_server_selection_timeout_tooltip}
                >
                    <Field name="clusterSettings.serverSelectionTimeout" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const ConnectionPoolConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.connection_pool)}
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
                    name="connectionPoolSettings.maintenanceFrequency"
                    label="Maintenance Frequency (ms)"
                    tooltip={messages.mongodb_maintenance_frequency_tooltip}
                >
                    <Field name="connectionPoolSettings.maintenanceFrequency" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="connectionPoolSettings.maintenanceInitialDelay"
                    label="Maintenance Initial Delay (ms)"
                    tooltip={messages.mongodb_maintenance_initial_delay_tooltip}
                >
                    <Field
                        name="connectionPoolSettings.maintenanceInitialDelay"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="connectionPoolSettings.maxConnectionIdleTime"
                    label="Max Connection Idle Time (ms)"
                    tooltip={messages.mongodb_max_connection_idle_time_tooltip}
                >
                    <Field name="connectionPoolSettings.maxConnectionIdleTime" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="connectionPoolSettings.maxConnectionLifeTime"
                    label="Max Connection Life Time"
                    tooltip={messages.mongodb_max_connection_life_time_tooltip}
                >
                    <Field name="connectionPoolSettings.maxConnectionLifeTime" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="connectionPoolSettings.maxWaitTime"
                    label="Max Wait Time (ms)"
                    tooltip={messages.mongodb_max_wait_time_tooltip}
                >
                    <Field name="connectionPoolSettings.maxWaitTime" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="connectionPoolSettings.maxWaitQueueSize"
                    label="Max Wait Queue Size"
                    tooltip={messages.mongodb_max_wait_queue_size_connection_pool_config_tooltip}
                >
                    <Field name="connectionPoolSettings.maxWaitQueueSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow name="connectionPoolSettings.minSize" label="Minimum Size" tooltip={messages.mongodb_min_size_tooltip}>
                    <Field name="connectionPoolSettings.minSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow name="connectionPoolSettings.maxSize" label="Max Size" tooltip={messages.mongodb_max_size_tooltip}>
                    <Field name="connectionPoolSettings.maxSize" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const ServerConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.server)}
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
                    name="serverSettings.heartbeatFrequency"
                    label="Heart Beat Frequency (ms)"
                    tooltip={messages.mongodb_heartbeat_frequency_tooltip}
                >
                    <Field name="serverSettings.heartbeatFrequency" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="serverSettings.minHeartbeatFrequency"
                    label="Min Heart Beat Frequency (ms)"
                    tooltip={messages.mongodb_min_heartbeat_frequency_tooltip}
                >
                    <Field name="serverSettings.minHeartbeatFrequency" type="number" className="theia-input" />
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
                    name="socketSettings.connectTimeout"
                    label="Connect Timeout (ms)"
                    tooltip={messages.mongodb_connect_timeout_tooltip}
                >
                    <Field name="socketSettings.connectTimeout" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketSettings.readTimeout"
                    label="Read Timeout (ms)"
                    tooltip={messages.mongodb_read_timeout_tooltip}
                >
                    <Field name="socketSettings.readTimeout" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketSettings.receiveBufferSize"
                    label="Receive Buffer Size"
                    tooltip={messages.mongodb_receive_buffer_size_tooltip}
                >
                    <Field name="socketSettings.receiveBufferSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="socketSettings.sendBufferSize"
                    label="Send Buffer Size"
                    tooltip={messages.mongodb_send_buffer_size_tooltip}
                >
                    <Field name="socketSettings.sendBufferSize" type="number" className="theia-input" />
                </FormRow>
            </div>
        </Collapsible>
    );
};
