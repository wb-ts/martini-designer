require("reflect-metadata");
import { setRootLogger } from "@theia/core/lib/common/logger";
/**
 * This is required to prevent the following error "The configuration is not set. Did you call FrontendApplicationConfigProvider#set?".
 */
jest.mock("@theia/core/lib/browser/frontend-application-config-provider", () => ({
    FrontendApplicationConfigProvider: {
        get: () => ({
            applicationName: "test",
            defaultIconTheme: "test",
            defaultTheme: "test"
        })
    }
}));

// Add other mock logger functions here as needed.
setRootLogger({
    //@ts-ignore
    debug: (message: any, ...params: any[]) => {
        // console.debug(message, ...params)
    }
});
