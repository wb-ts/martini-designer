import { RecursivePartial } from "@theia/core";
import { Field, Form, Formik, FormikErrors, useFormikContext } from "formik";
import { noop, startCase } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import {
    RedisDatabaseConnection,
    RedisDisconnectedBehavior,
    RedisSslProvider
} from "../../../../common/database-connection/martini-database-connection-manager";
import { List, ListItem } from "../../../components/list";
import { applySize, BaseDialog } from "../../../dialogs/dialogs";
import { FormRow, OnFormChange, validateSchema } from "../../../form/form";

export interface UriFormat {
    label: string;
    value: string;
}

export interface RedisConnectionFormProps {
    connection: RedisDatabaseConnection;
    reset: boolean;
    onChange: (connection: RedisDatabaseConnection) => void;
    onValidate: (errors: FormikErrors<RedisDatabaseConnection>) => void;
}

export const RedisConnectionForm: React.FC<RedisConnectionFormProps> = ({
    connection,
    reset,
    onChange,
    onValidate
}) => {
    const schema = React.useMemo(
        () =>
            Yup.object().shape<RecursivePartial<RedisDatabaseConnection>>({
                uri: Yup.string()
                    .required()
                    .test(
                        "valid-uri",
                        messages.redis_invalid_uri,
                        (value: string) =>
                            value.startsWith("redis://") ||
                            value.startsWith("rediss://") ||
                            value.startsWith("redis+ssl://") ||
                            value.startsWith("redis-socket://") ||
                            value.startsWith("redis+socket://") ||
                            value.startsWith("redis-sentinel://")
                    ),
                clientOptions: Yup.object().shape<RecursivePartial<RedisDatabaseConnection["clientOptions"]>>({
                    requestQueueSize: Yup.number().integer(),
                    sslOptions: Yup.object().shape<Partial<RedisDatabaseConnection["clientOptions"]["sslOptions"]>>({
                        keystorePassword: Yup.string().test(
                            "keystore-file-required",
                            messages.redis_keystore_file_not_set,
                            function (value: string) {
                                return !value?.length || this.parent.keystoreFile?.length > 0;
                            }
                        ),
                        truststorePassword: Yup.string().test(
                            "truststore-file-required",
                            messages.redis_truststore_file_not_set,
                            function (value: string) {
                                return !value?.length || this.parent.truststoreFile?.length > 0;
                            }
                        )
                    }),
                    socketOptions: Yup.object().shape<
                        Partial<RedisDatabaseConnection["clientOptions"]["socketOptions"]>
                    >({
                        connectTimeoutMillis: Yup.number().integer()
                    }),
                    connectionOptions: Yup.object().shape<
                        Partial<RedisDatabaseConnection["clientOptions"]["connectionOptions"]>
                    >({
                        connectionTimeoutMillis: Yup.number().integer()
                    }),
                    connectionPoolOptions: Yup.object().shape<
                        Partial<RedisDatabaseConnection["clientOptions"]["connectionPoolOptions"]>
                    >({
                        maxTotal: Yup.number().integer(),
                        maxIdle: Yup.number().integer(),
                        minIdle: Yup.number().integer(),
                        timeBetweenEvictionRunsMillis: Yup.number().integer(),
                        minEvictableIdleTimeMillis: Yup.number().integer(),
                        softMinEvictableIdleTimeMillis: Yup.number().integer(),
                        numTestsPerEvictionRun: Yup.number().integer(),
                        evictorShutdownTimeoutMillis: Yup.number().integer(),
                        maxWaitMillis: Yup.number().integer()
                    })
                })
            }),
        []
    );

    const validate = (connection: RedisDatabaseConnection) => validateSchema(schema, connection, onValidate);

    return (
        <Formik<RedisDatabaseConnection>
            initialValues={connection}
            initialTouched={{
                uri: true,
                clientOptions: {
                    requestQueueSize: true,
                    sslOptions: {
                        keystorePassword: true,
                        truststorePassword: true
                    },
                    socketOptions: {
                        connectTimeoutMillis: true
                    },
                    connectionOptions: {
                        connectionTimeoutMillis: true
                    },
                    connectionPoolOptions: {
                        maxTotal: true,
                        maxIdle: true,
                        minIdle: true,
                        timeBetweenEvictionRunsMillis: true,
                        minEvictableIdleTimeMillis: true,
                        softMinEvictableIdleTimeMillis: true,
                        numTestsPerEvictionRun: true,
                        evictorShutdownTimeoutMillis: true,
                        maxWaitMillis: true
                    }
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
                <SSLConfigurationSection />
                <SocketConfigurationSection />
                <ConnectionConfigurationSection />
            </Form>
        </Formik>
    );
};

const GeneralConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<RedisDatabaseConnection>();

    const handleChooseUriFormat = async () => {
        const dialog = new UriFormatSelectionDialog();
        const uri = await dialog.open();
        if (uri) context.setFieldValue("uri", uri.value);
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
                <FormRow
                    name="uri"
                    label="URI"
                    tooltip={messages.redis_uri_tooltip}
                    gridTemplateColumns="1fr max-content"
                >
                    <Field name="uri" type="text" className="theia-input" />
                    <input
                        type="button"
                        className="theia-button"
                        value={messages.choose}
                        onClick={handleChooseUriFormat}
                    />
                </FormRow>
                <FormRow name="password" label="Password" tooltip={messages.connection_password_tooltip}>
                    <Field name="password" type="password" className="theia-input" />
                </FormRow>
                <FormRow name="autoStart" label="Auto Start" tooltip={messages.auto_start_tooltip}>
                    <Field name="autoStart" type="checkbox" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const AdvancedConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(true);
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
                    name="clientOptions.pingBeforeActivateConnection"
                    label="Ping Before Activate Connection"
                    tooltip={messages.redis_ping_before_activate_connection_tooltip}
                >
                    <Field name="clientOptions.pingBeforeActivateConnection" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.autoReconnect"
                    label="Auto Reconnect"
                    tooltip={messages.redis_auto_reconnect_tooltip}
                >
                    <Field name="clientOptions.autoReconnect" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.cancelCommandsOnReconnectFailure"
                    label="Cancel Commands On Reconnect Failure"
                    tooltip={messages.redis_cancel_command_on_reconnect_failure_tooltip}
                >
                    <Field name="clientOptions.cancelCommandsOnReconnectFailure" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.publishOnScheduler"
                    label="Publish On Scheduler"
                    tooltip={messages.redis_publish_on_scheduler_tooltip}
                >
                    <Field name="clientOptions.publishOnScheduler" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.suspendReconnectOnProtocolFailure"
                    label="Suspend Reconnect On Protocol Failure"
                    tooltip={messages.redis_suspend_reconnect_on_protocol_failure_tooltip}
                >
                    <Field name="clientOptions.suspendReconnectOnProtocolFailure" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.requestQueueSize"
                    label="Request Queue Size"
                    tooltip={messages.redis_request_queue_size_tooltip}
                >
                    <Field name="clientOptions.requestQueueSize" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.disconnectedBehavior"
                    label="Disconnected Behavior"
                    tooltip={messages.redis_disconnected_behavior_tooltip}
                >
                    <Field name="clientOptions.disconnectedBehavior" as="select" className="theia-select">
                        {Object.values(RedisDisconnectedBehavior).map(behavior => (
                            <option key={behavior} value={behavior}>
                                {startCase(behavior.toLowerCase())}
                            </option>
                        ))}
                    </Field>
                </FormRow>
            </div>
        </Collapsible>
    );
};

const SSLConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title("SSL")}
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
                    name="clientOptions.sslOptions.sslProvider"
                    label="SSL Provider"
                    tooltip={messages.redis_ssl_provider_tooltip}
                >
                    <Field name="clientOptions.sslOptions.sslProvider" as="select" className="theia-select">
                        {Object.values(RedisSslProvider).map(provider => (
                            <option key={provider} value={provider}>
                                {provider}
                            </option>
                        ))}
                    </Field>
                </FormRow>
                <FormRow
                    name="clientOptions.sslOptions.keystoreFile"
                    label="Keystore File"
                    tooltip={messages.redis_keystore_file_tooltip}
                >
                    <Field name="clientOptions.sslOptions.keystoreFile" type="text" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.sslOptions.keystorePassword"
                    label="Keystore Password"
                    tooltip={messages.redis_keystore_password_tooltip}
                >
                    <Field name="clientOptions.sslOptions.keystorePassword" type="password" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.sslOptions.truststoreFile"
                    label="Truststore File"
                    tooltip={messages.redis_truststore_file_tooltip}
                >
                    <Field name="clientOptions.sslOptions.truststoreFile" type="text" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.sslOptions.truststorePassword"
                    label="Truststore Password"
                    tooltip={messages.redis_truststore_password_tooltip}
                >
                    <Field name="clientOptions.sslOptions.truststorePassword" type="password" className="theia-input" />
                </FormRow>
                <FormRow name="clientOptions.sslOptions.startTls" label="Start TLS" tooltip={messages.redis_start_tls_tooltip}>
                    <Field name="clientOptions.sslOptions.startTls" type="checkbox" />
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
                    name="clientOptions.socketOptions.connectTimeoutMillis"
                    label="Connect Timeout (ms)"
                    tooltip={messages.redis_connection_timeout_tooltip}
                >
                    <Field
                        name="clientOptions.socketOptions.connectTimeoutMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.socketOptions.keepAlive"
                    label="Keep Alive"
                    tooltip={messages.redis_keep_alive_tooltip}
                >
                    <Field name="clientOptions.socketOptions.keepAlive" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.socketOptions.tcpNoDelay"
                    label="TCP No Delay"
                    tooltip={messages.redis_tcp_no_delay_tooltip}
                >
                    <Field name="clientOptions.socketOptions.tcpNoDelay" type="checkbox" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

const ConnectionConfigurationSection: React.FC = () => {
    const [opened, setOpened] = React.useState(false);
    const handleFocus = () => setOpened(true);

    return (
        <Collapsible
            trigger={messages.configuration_title(messages.connection)}
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
                    name="clientOptions.connectionOptions.connectionTimeoutMillis"
                    label="Connection Timeout (ms)"
                    tooltip={messages.redis_connection_timeout_tooltip}
                >
                    <Field
                        name="clientOptions.connectionOptions.connectionTimeoutMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionOptions.autoFlushCommands"
                    label="Auto Flush Commands"
                    tooltip={messages.redis_auto_flush_tooltip}
                >
                    <Field name="clientOptions.connectionOptions.autoFlushCommands" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.maxTotal"
                    label="Maximum Total"
                    tooltip={messages.redis_max_total_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.maxTotal" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.maxIdle"
                    label="Maximum Idle"
                    tooltip={messages.redis_max_idle_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.maxIdle" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.minIdle"
                    label="Minimum Idle"
                    tooltip={messages.redis_min_idle_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.minIdle" type="number" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.evictionPolicyClassName"
                    label="Eviction Policy Name"
                    tooltip={messages.redis_eviction_policy_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.evictionPolicyClassName"
                        type="text"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.timeBetweenEvictionRunsMillis"
                    label="Time Between Eviction Runs (ms)"
                    tooltip={messages.redis_time_between_eviction_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.timeBetweenEvictionRunsMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.minEvictableIdleTimeMillis"
                    label="Evictable Idle Time (ms)"
                    tooltip={messages.redis_min_evictable_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.minEvictableIdleTimeMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.softMinEvictableIdleTimeMillis"
                    label="Soft Evictable Idle Time (ms)"
                    tooltip={messages.redis_soft_min_evictable_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.softMinEvictableIdleTimeMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.numTestsPerEvictionRun"
                    label="Tests Per Eviction Run"
                    tooltip={messages.redis_test_per_eviction_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.numTestsPerEvictionRun"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.evictorShutdownTimeoutMillis"
                    label="Evictor Shutdown Timeout (ms)"
                    tooltip={messages.redis_evictor_shutdown_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.evictorShutdownTimeoutMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.jmxEnabled"
                    label="JMX Enabled"
                    tooltip={messages.redis_jmx_enabled_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.jmxEnabled" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.jmxNameBase"
                    label="JMX Name Base"
                    tooltip={messages.redis_jmx_name_base_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.jmxNameBase" type="text" className="theia-input" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.jmxNamePrefix"
                    label="JMX Name Prefix"
                    tooltip={messages.redis_jmx_name_prefix_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.jmxNamePrefix"
                        type="text"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.maxWaitMillis"
                    label="Maximum Wait"
                    tooltip={messages.redis_max_wait_tooltip}
                >
                    <Field
                        name="clientOptions.connectionPoolOptions.maxWaitMillis"
                        type="number"
                        className="theia-input"
                    />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.blockWhenExhausted"
                    label="Block When Exhausted"
                    tooltip={messages.redis_block_when_exhausted_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.blockWhenExhausted" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.lifo"
                    label="LIFO"
                    tooltip={messages.redis_lifo_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.lifo" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.fairness"
                    label="Fairness"
                    tooltip={messages.redis_fairness_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.fairness" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.testOnCreate"
                    label="Test On Create"
                    tooltip={messages.redis_test_create_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.testOnCreate" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.testOnBorrow"
                    label="Test On Borrow"
                    tooltip={messages.redis_test_borrow_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.testOnBorrow" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.testOnReturn"
                    label="Test On Return"
                    tooltip={messages.redis_test_return_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.testOnReturn" type="checkbox" />
                </FormRow>
                <FormRow
                    name="clientOptions.connectionPoolOptions.testWhileIdle"
                    label="Test While Idle"
                    tooltip={messages.redis_test_idle_tooltip}
                >
                    <Field name="clientOptions.connectionPoolOptions.testWhileIdle" type="checkbox" />
                </FormRow>
            </div>
        </Collapsible>
    );
};

export class UriFormatSelectionDialog extends BaseDialog<UriFormat> {
    value: UriFormat;
    private readonly uris: UriFormat[] = [
        {
            label: "Redis Sentinel",
            value: "redis-sentinel://<HOST1>:<PORT1>,<HOST_N>:<PORT_N>/<DATABASE>"
        },
        {
            label: "Redis Standalone",
            value: "redis://<HOST>:6379/<DATABASE>"
        },
        {
            label: "Redis Standalone SSL",
            value: "rediss://<HOST>:6379/<DATABASE>"
        },
        {
            label: "Redis Standalone SSL Alt",
            value: "redis+ssl://<HOST>:6379/<DATABASE>"
        },
        {
            label: "Redis Standalone SSL Unix Domain Sockets",
            value: "redis-socket://<PATH>"
        },
        {
            label: "Redis Standalone SSL Unix Domain Sockets Alt",
            value: "redis+socket://<PATH>"
        }
    ];

    constructor() {
        super({ title: messages.redis_uri_formats_title });
        applySize(this.contentNode, { height: 200 });

        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.select_btn);

        this.value = this.uris[0];
    }

    protected doRender(): React.ReactNode {
        const items: ListItem[] = this.uris.map((uri, index) => ({
            label: `${uri.label} (${uri.value})`,
            data: uri,
            selected: index === 0
        }));

        return (
            <List
                items={items}
                filtered={true}
                style={{ height: "100%" }}
                focus={true}
                onDoubleClick={() => this.accept()}
                onSelectionChanged={selection => {
                    this.value = selection.data;
                    this.validate();
                }}
            />
        );
    }
}
