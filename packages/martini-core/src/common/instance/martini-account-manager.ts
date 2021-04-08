import {JsonRpcServer} from "@theia/core";

export const martiniAccountManagerPath = "/services/martini/accounts";

export const MartiniAccountManager = Symbol("MartiniAccountManagerNode");

export interface MartiniAccountManager
    extends JsonRpcServer<MartiniAccountManagerClient> {
    getAccountName(): Promise<string | undefined>;

    set(accountName: string, password: string): Promise<void>;
}

export interface MartiniAccountManagerClient {
    onUpdated(): void;

    onReady?(): void;
}
