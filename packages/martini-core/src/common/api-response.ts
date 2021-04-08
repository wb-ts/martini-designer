export interface ApiResponse {
    result: string;
    message: string;
    payload?: any;
    logMessages?: ApiLogMessage[];
}

export namespace ApiResponse {
    export function isOk(response: ApiResponse) {
        return response.result === "OK";
    }
    export function isError(response: ApiResponse) {
        return response.result === "ERROR";
    }
}

export interface ApiLogMessage {
    message: string;
    type: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
}
