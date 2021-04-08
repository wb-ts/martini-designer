import { JsonRpcServer } from "@theia/core";
import { MartiniEvent } from "../event/martini-event";
import { startCase } from "lodash";

export enum DatabaseType {
    CASSANDRA = "cassandra",
    JDBC = "jdbc",
    MONGODB = "mongodb",
    REDIS = "redis"
}

export interface DatabaseConnection {
    name: string;
    autoStart: boolean;
    status: "STARTED" | "STOPPED";
    type: DatabaseType;
}

export namespace DatabaseConnection {
    export function is(object: any): object is DatabaseConnection {
        return (
            !!object &&
            typeof object === "object" &&
            "name" in object &&
            "autoStart" in object &&
            "status" in object &&
            "type" in object
        );
    }
    export function getType(type: string): DatabaseType | undefined {
        const typeKey: string | undefined = Object.keys(DatabaseType).find(
            (key: string) => DatabaseType[key as keyof typeof DatabaseType] === type
        );
        return typeKey ? DatabaseType[typeKey as keyof typeof DatabaseType] : undefined;
    }
}

export const martiniDatabaseConnectionManagerPath = "/services/martini/database/connections";

export const MartiniDatabaseConnectionManager = Symbol("MartiniDatabaseConnectionManager");

export interface MartiniDatabaseConnectionManager extends JsonRpcServer<MartiniDatabaseConnectionManagerClient> {
    getAll(): Promise<DatabaseConnection[]>;

    get(name: string): Promise<DatabaseConnection>;

    start(name: string): Promise<void>;

    stop(name: string): Promise<void>;

    delete(name: string): Promise<void>;

    save(connection: DatabaseConnection): Promise<void>;

    test(connection: DatabaseConnection): Promise<void>;

    getDrivers(): Promise<Driver[]>;
}

export interface DatabaseConnectionEvent extends MartiniEvent {
    event: "SAVED" | "DELETED" | "STARTED" | "STOPPED" | "ENABLED" | "DISABLED";
    name: string;
}

export namespace DatabaseConnectionEvent {
    export function is(event: MartiniEvent): event is DatabaseConnectionEvent {
        return event.type === "DATABASE_CONNECTION";
    }
}

export interface MartiniDatabaseConnectionManagerClient {
    onEvent(event: DatabaseConnectionEvent): void;
}

export const getTypeLabel = (type: DatabaseType) => {
    if (type === DatabaseType.JDBC) return "JDBC";
    return startCase(type.toLowerCase());
};

export enum JdbcIsolationLevel {
    READ_COMMITTED = "READ_COMMITTED",
    READ_UNCOMMITTED = "READ_UNCOMMITTED",
    REPEATABLE_READ = "REPEATABLE_READ",
    SERIALIZABLE = "SERIALIZABLE"
}

export interface Driver {
    templateUrl: string;
    name: string;
    className: string;
    xaClassName: string;
}

export interface JdbcDatabaseConnection extends DatabaseConnection {
    type: DatabaseType.JDBC;
    url: string;
    xa: boolean;
    driverClassName: string;
    username?: string;
    password: string;
    acquireIncrement: number;
    acquisitionInterval: number;
    acquisitionTimeout: number;
    allowLocalTransactions: boolean;
    applyTransactionTimeout: boolean;
    automaticEnlistingEnabled: boolean;
    deferConnectionRelease: boolean;
    enableJdbc4ConnectionTest: boolean;
    ignoreRecoveryFailures: boolean;
    isolationLevel: JdbcIsolationLevel;
    maxIdleTime: number;
    minPoolSize: number;
    maxPoolSize: number;
    preparedStatementCacheSize: number;
    shareTransactionConnections: boolean;
    testQuery?: string;
    twoPcOrderingPosition: number;
    uniqueName?: string;
    useTmJoin: boolean;
    loginTimeout: number;
}

export enum CassandraCompression {
    NONE = "NONE",
    SNAPPY = "SNAPPY",
    LZ4 = "LZ4"
}

export enum CassandraConsistencyLevel {
    ANY = "ANY",
    ONE = "ONE",
    TWO = "TWO",
    THREE = "THREE",
    QUORUM = "QUORUM",
    ALL = "ALL",
    LOCAL_QUORUM = "LOCAL_QUORUM",
    EACH_QUORUM = "EACH_QUORUM",
    SERIAL = "SERIAL",
    LOCAL_SERIAL = "LOCAL_SERIAL",
    LOCAL_ONE = "LOCAL_ONE"
}

export interface CassandraDatabaseConnection extends DatabaseConnection {
    type: DatabaseType.CASSANDRA;
    contactPoints: string[];
    port: number;
    maxSchemaAgreementWaitSeconds: number;
    credentials: {
        username?: string;
        password: string;
    };
    compression: CassandraCompression;
    metrics: boolean;
    ssl: boolean;
    poolingOptions: {
        coreConnectionsPerHostLocal: number;
        coreConnectionsPerHostRemote: number;
        maxConnectionsPerHostLocal: number;
        maxConnectionsPerHostRemote: number;
        newConnectionThresholdLocal: number;
        newConnectionThresholdRemote: number;
        maxRequestsPerConnectionLocal: number;
        maxRequestsPerConnectionRemote: number;
        idleTimeoutSeconds: number;
        poolTimeoutMillis: number;
        maxQueueSize: number;
        heartbeatIntervalSeconds: number;
    };
    socketOptions: {
        connectTimeoutMillis: number;
        readTimeoutMillis: number;
        keepAlive: boolean;
        reuseAddress: boolean;
        soLinger: number;
        tcpNoDelay: boolean;
        receiveBufferSize: number;
        sendBufferSize: number;
    };
    queryOptions: {
        consistencyLevel: CassandraConsistencyLevel;
        serialConsistencyLevel: CassandraConsistencyLevel;
        fetchSize: number;
        defaultIdempotence: boolean;
        prepareOnAllHosts: boolean;
        reprepareOnUp: boolean;
        refreshSchemaIntervalMillis: number;
        maxPendingRefreshSchemaRequests: number;
        refreshNodeListIntervalMillis: number;
        maxPendingRefreshNodeListRequests: number;
        refreshNodeIntervalMillis: number;
        maxPendingRefreshNodeRequests: number;
    };
}

export enum MongoDbAuthenticationMechanism {
    AUTO = "AUTO",
    PLAIN = "PLAIN",
    SCRAM_SHA_1 = "SCRAM_SHA_1",
    SCRAM_SHA_256 = "SCRAM_SHA_256"
}

export enum MongoDbClusterType {
    STANDALONE = "STANDALONE",
    REPLICA_SET = "REPLICA_SET",
    SHARDED = "SHARDED",
    UNKNOWN = "UNKNOWN"
}

export interface MongoDbDatabaseConnection extends DatabaseConnection {
    type: DatabaseType.MONGODB;
    connectionString: string;
    username?: string;
    password: string;
    authenticationDatabase?: string;
    authenticationMechanism: MongoDbAuthenticationMechanism;
    clusterSettings: {
        localThreshold: number;
        maxWaitQueueSize: number;
        serverSelectionTimeout: number;
        type: MongoDbClusterType;
        hosts: string[];
    };
    connectionPoolSettings: {
        maintenanceFrequency: number;
        maintenanceInitialDelay: number;
        minSize: number;
        maxConnectionIdleTime: number;
        maxConnectionLifeTime: number;
        maxWaitTime: number;
        maxWaitQueueSize: number;
        maxSize: number;
    };
    serverSettings: {
        heartbeatFrequency: number;
        minHeartbeatFrequency: number;
    };
    socketSettings: {
        connectTimeout: number;
        readTimeout: number;
        receiveBufferSize: number;
        sendBufferSize: number;
    };
}

export enum RedisDisconnectedBehavior {
    DEFAULT = "DEFAULT",
    ACCEPT_COMMANDS = "ACCEPT_COMMANDS",
    REJECT_COMMANDS = "REJECT_COMMANDS"
}
export enum RedisSslProvider {
    JDK = "JDK",
    OPENSSL = "OPENSSL"
}
export interface RedisDatabaseConnection extends DatabaseConnection {
    type: DatabaseType.REDIS;
    uri: string;
    password: string;
    clientOptions: {
        pingBeforeActivateConnection: boolean;
        autoReconnect: boolean;
        cancelCommandsOnReconnectFailure: boolean;
        publishOnScheduler: boolean;
        suspendReconnectOnProtocolFailure: boolean;
        requestQueueSize: number;
        disconnectedBehavior: RedisDisconnectedBehavior;
        socketOptions: {
            connectTimeoutMillis: number;
            keepAlive: boolean;
            tcpNoDelay: boolean;
        };
        sslOptions: {
            sslProvider: RedisSslProvider;
            keystoreFile?: string;
            keystorePassword?: string;
            truststoreFile?: string;
            truststorePassword?: string;
            startTls: boolean;
        };
        connectionOptions: {
            autoFlushCommands: boolean;
            connectionTimeoutMillis: number;
        };
        connectionPoolOptions: {
            maxTotal: number;
            maxIdle: number;
            minIdle: number;
            lifo: boolean;
            fairness: boolean;
            maxWaitMillis: number;
            minEvictableIdleTimeMillis: number;
            softMinEvictableIdleTimeMillis: number;
            numTestsPerEvictionRun: number;
            evictorShutdownTimeoutMillis: number;
            testOnCreate: boolean;
            testOnBorrow: boolean;
            testOnReturn: boolean;
            testWhileIdle: boolean;
            timeBetweenEvictionRunsMillis: number;
            evictionPolicyClassName?: string;
            blockWhenExhausted: boolean;
            jmxEnabled: boolean;
            jmxNameBase?: string;
            jmxNamePrefix?: string;
        };
    };
}
