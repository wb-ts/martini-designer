import {
    MongoDbDatabaseConnection,
    MongoDbAuthenticationMechanism,
    MongoDbClusterType,
    DatabaseType
} from "../../../../common/database-connection/martini-database-connection-manager";

export default function createDefaultMongodbDatabaseConnection(name: string): MongoDbDatabaseConnection {
    return {
        name,
        type: DatabaseType.MONGODB,
        status: "STOPPED",
        connectionString: "mongodb://localhost:27017",
        password: "",
        authenticationMechanism: MongoDbAuthenticationMechanism.AUTO,
        autoStart: true,
        clusterSettings: {
            hosts: [],
            type: MongoDbClusterType.UNKNOWN,
            localThreshold: 15,
            serverSelectionTimeout: 30_000,
            maxWaitQueueSize: 0
        },
        connectionPoolSettings: {
            maintenanceFrequency: 60_000,
            maintenanceInitialDelay: 0,
            maxConnectionIdleTime: 0,
            maxConnectionLifeTime: 0,
            maxWaitTime: 120_000,
            maxWaitQueueSize: 500,
            minSize: 0,
            maxSize: 100
        },
        serverSettings: {
            heartbeatFrequency: 10_000,
            minHeartbeatFrequency: 500
        },
        socketSettings: {
            connectTimeout: 10_000,
            readTimeout: 0,
            receiveBufferSize: 0,
            sendBufferSize: 0
        }
    };
}
