import {ApiResponse} from "../../common/api-response";
import {ConfirmDialog} from "../dialogs/dialogs";
import * as React from "react";
import {createListMessage} from "./dialogs";
import {injectable} from "inversify";

@injectable()
export class ApiResponseHandler {

    handle(response: ApiResponse): Promise<void> {
        return new ConfirmDialog({
            title: ApiResponse.isOk(response) ? "Success" : "Error",
            msg: this.generateMessage(response),
            showCancel: false
        }).open().then();
    }

    private generateMessage(response: ApiResponse): string | React.ReactNode {
        if (ApiResponse.isError(response) || !response.logMessages || response.logMessages.length === 0)
            return response.message;

        const hasWarnings = response.logMessages.some(log => log.type === "WARN");
        const hasErrors = response.logMessages.some(log => log.type === "ERROR");
        let message = "";
        if (hasWarnings && !hasErrors)
            message = "Completed with warnings:";
        else if (hasErrors && !hasWarnings)
            message = "Completed with errors:";
        else if (hasWarnings && hasErrors)
            message = "Completed with warnings and errors:";
        return <>
            {response.message}
            <br/>
            <br/>
            {(hasWarnings || hasErrors) && createListMessage(message, response.logMessages.map(log => log.message))}
        </>;
    }

}
