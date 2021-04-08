import { flattenFormikErrors } from "../../browser/form/form";

describe("flattenFormikErrors", () => {
    test("Nested formik errors should be flattened", () => {
        const errors = flattenFormikErrors({
            uri: "Invalid format",
            clientOptions: {
                autoReconnect: "Cannot be blank",
                socketOptions: {
                    connectTimeoutMillis: "Not a positive number"
                },
                connectionPoolOptions: {
                    minEvictableIdleTimeMillis: "Not a number"
                }
            }
        });

        expect(errors).toEqual([
            {
                key: "uri",
                message: "Invalid format"
            },
            {
                key: "clientOptions.autoReconnect",
                message: "Cannot be blank"
            },
            {
                key: "clientOptions.socketOptions.connectTimeoutMillis",
                message: "Not a positive number"
            },
            {
                key: "clientOptions.connectionPoolOptions.minEvictableIdleTimeMillis",
                message: "Not a number"
            }
        ]);
    });
});
