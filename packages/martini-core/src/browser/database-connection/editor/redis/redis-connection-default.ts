import {
    RedisDatabaseConnection,
    DatabaseType,
    RedisDisconnectedBehavior,
    RedisSslProvider
} from "../../../../common/database-connection/martini-database-connection-manager";

export default function createDefaultRedisDatabaseConnection(name: string): RedisDatabaseConnection {
    return {
        name,
        type: DatabaseType.REDIS,
        uri: "redis://<HOST>:6379/<DATABASE>",
        password: "",
        autoStart: true,
        status: "STOPPED",
        clientOptions: {
            pingBeforeActivateConnection: false,
            autoReconnect: true,
            cancelCommandsOnReconnectFailure: false,
            publishOnScheduler: false,
            suspendReconnectOnProtocolFailure: false,
            requestQueueSize: 2147483647,
            disconnectedBehavior: RedisDisconnectedBehavior.DEFAULT,
            sslOptions: {
                sslProvider: RedisSslProvider.JDK,
                startTls: false
            },
            socketOptions: {
                connectTimeoutMillis: 10000,
                keepAlive: false,
                tcpNoDelay: false
            },
            connectionOptions: {
                autoFlushCommands: true,
                connectionTimeoutMillis: -1
            },
            connectionPoolOptions: {
                blockWhenExhausted: true,
                evictorShutdownTimeoutMillis: 10000,
                fairness: false,
                testOnCreate: false,
                jmxEnabled: false,
                lifo: true,
                maxIdle: 8,
                maxTotal: 8,
                maxWaitMillis: 0,
                minEvictableIdleTimeMillis: 1800000,
                minIdle: 0,
                numTestsPerEvictionRun: 3,
                softMinEvictableIdleTimeMillis: -1,
                testOnBorrow: false,
                testOnReturn: false,
                testWhileIdle: false,
                timeBetweenEvictionRunsMillis: -1
            }
        }
    };
}
