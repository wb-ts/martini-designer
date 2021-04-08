import {
    CassandraCompression,
    CassandraConsistencyLevel,
    DatabaseType,
    CassandraDatabaseConnection
} from "../../../../common/database-connection/martini-database-connection-manager";

export default function createDefaultCassandraDatabaseConnection(name: string): CassandraDatabaseConnection {
    return {
        name,
        type: DatabaseType.CASSANDRA,
        status: "STOPPED",
        autoStart: true,
        port: 9042,
        ssl: false,
        credentials: {
            username: "",
            password: ""
        },
        contactPoints: [],
        maxSchemaAgreementWaitSeconds: 10,
        compression: CassandraCompression.NONE,
        metrics: true,
        poolingOptions: {
            coreConnectionsPerHostLocal: 1,
            coreConnectionsPerHostRemote: 1,
            maxConnectionsPerHostLocal: 1,
            maxConnectionsPerHostRemote: 1,
            newConnectionThresholdLocal: 800,
            newConnectionThresholdRemote: 200,
            maxRequestsPerConnectionLocal: 1024,
            maxRequestsPerConnectionRemote: 256,
            idleTimeoutSeconds: 120,
            poolTimeoutMillis: 5000,
            maxQueueSize: 256,
            heartbeatIntervalSeconds: 30
        },
        socketOptions: {
            connectTimeoutMillis: 5000,
            readTimeoutMillis: 12000,
            keepAlive: true,
            reuseAddress: true,
            soLinger: 0,
            tcpNoDelay: true,
            receiveBufferSize: 0,
            sendBufferSize: 0
        },
        queryOptions: {
            consistencyLevel: CassandraConsistencyLevel.LOCAL_ONE,
            serialConsistencyLevel: CassandraConsistencyLevel.SERIAL,
            fetchSize: 5000,
            defaultIdempotence: false,
            prepareOnAllHosts: true,
            reprepareOnUp: true,
            refreshSchemaIntervalMillis: 1000,
            maxPendingRefreshSchemaRequests: 20,
            refreshNodeListIntervalMillis: 1000,
            maxPendingRefreshNodeListRequests: 20,
            refreshNodeIntervalMillis: 1000,
            maxPendingRefreshNodeRequests: 20
        }
    };
}
