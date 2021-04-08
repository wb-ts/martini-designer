import {
    DatabaseType,
    JdbcIsolationLevel,
    JdbcDatabaseConnection
} from "../../../../common/database-connection/martini-database-connection-manager";

export default function createDefaultJdbcDatabaseConnection(name: string): JdbcDatabaseConnection {
    return {
        name,
        autoStart: true,
        status: "STOPPED",
        type: DatabaseType.JDBC,
        url: "jdbc:hsqldb:file:[PATH-TO-DATABASE-DIRECTORY]/[DATABASE-NAME]",
        xa: false,
        driverClassName: "org.hsqldb.jdbc.JDBCDriver",
        password: "",
        acquireIncrement: 1,
        acquisitionInterval: 1,
        acquisitionTimeout: 30,
        allowLocalTransactions: true,
        applyTransactionTimeout: false,
        automaticEnlistingEnabled: true,
        deferConnectionRelease: false,
        enableJdbc4ConnectionTest: false,
        ignoreRecoveryFailures: false,
        isolationLevel: JdbcIsolationLevel.READ_COMMITTED,
        maxIdleTime: 60,
        minPoolSize: 0,
        maxPoolSize: 5,
        preparedStatementCacheSize: 0,
        shareTransactionConnections: false,
        twoPcOrderingPosition: 0,
        useTmJoin: true,
        loginTimeout: 0
    };
}
