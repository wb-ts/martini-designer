import axios, { AxiosInstance } from "axios";
import { inject, injectable, postConstruct } from "inversify";
import * as qs from "querystring";
import {
    MartiniInstanceInfo,
    MartiniInstanceInfoManager
} from "../../../common/instance/martini-instance-info-manager";
import { AxiosInstanceContribution } from "../../http/axios-instance-factory";
import { MartiniAccountManagerNode } from "../node-martini-account-manager";

export const AuthService = Symbol("AuthService");

export interface AuthService {
    getToken(create?: boolean): Promise<Token | undefined>;

    logout(): Promise<boolean>;
}

export interface Token {
    accessToken: string;
    tokenType: string;
    refreshToken: string;
    expiresAt: number;
    scope: string;
}

@injectable()
export class AuthServiceImpl implements AuthService, AxiosInstanceContribution {
    @inject(MartiniAccountManagerNode)
    private readonly accountManager: MartiniAccountManagerNode;
    @inject(MartiniInstanceInfoManager)
    private readonly instanceInfoManager: MartiniInstanceInfoManager;

    private readonly CLIENT_ID_SECRET = "TOROMartini";
    private token: Token | undefined;
    private ready: Promise<void>;
    private axios: AxiosInstance;

    @postConstruct()
    protected init() {
        const doLogout = () => {
            try {
                this.logout();
            } catch (ignored) {}
        };
        process.on("exit", doLogout);

        this.axios = axios.create({
            validateStatus: () => true
        });
        this.ready = this.getToken(true).then();
    }

    async getToken(create: boolean = true): Promise<Token | undefined> {
        await this.ready;
        if (this.token) return this.token;
        else if (!create) return undefined;

        const instance = await this.instanceInfoManager.get();

        if (!instance) return undefined;

        const username = await this.accountManager.getAccountName();
        const password = await this.accountManager.getPassword();

        if (!password || !username) {
            console.error("No username or password configured, cannot create oauth token.");
            return undefined;
        }

        const response = await this.axios.post(
            MartiniInstanceInfo.getUri(instance, "oauth/token").toString(),
            qs.stringify({
                grant_type: "password",
                username,
                password,
                client_id: this.CLIENT_ID_SECRET,
                client_secret: this.CLIENT_ID_SECRET
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            }
        );

        const body = response.data;

        if (response.status === 200) {
            this.token = {
                accessToken: body.access_token,
                tokenType: body.token_type,
                refreshToken: body.refresh_token,
                expiresAt: body.expires_in + Date.now(),
                scope: body.scope
            } as Token;
            console.log("Created oauth token");
            return this.token;
        }

        throw new Error(`Failed to retrieve oauth token (${response.status}): ${JSON.stringify(body)}`);
    }

    async logout(): Promise<boolean> {
        await this.ready;
        if (!this.token) return false;

        const instance = await this.instanceInfoManager.get();

        if (!instance) return false;

        const response = await this.axios.post(
            MartiniInstanceInfo.getUri(instance, "oauth/token/revoke").toString(),
            qs.stringify({
                access_token: this.token.accessToken
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            }
        );

        const body = await response.data();

        if (response.status === 204) {
            console.log(`Revoked oauth token`);
            return true;
        }
        this.token = undefined;

        throw new Error(`Failed to revoke token: ${JSON.stringify(body)}`);
    }

    private async refreshToken(): Promise<Token | undefined> {
        const instance = await this.instanceInfoManager.get();

        if (!instance || !this.token) return undefined;

        if (Date.now() >= this.token.expiresAt) {
            const response = await this.axios.post(
                MartiniInstanceInfo.getUri(instance, "oauth/token").toString(),
                qs.stringify({
                    grant_type: "refresh_token",
                    refresh_token: this.token.refreshToken,
                    client_id: this.CLIENT_ID_SECRET,
                    client_secret: this.CLIENT_ID_SECRET
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                    }
                }
            );

            const body = response.data;

            if (response.status === 200) {
                return {
                    accessToken: body.access_token,
                    tokenType: body.token_type,
                    refreshToken: body.refresh_token,
                    expiresAt: body.expires_in + Date.now,
                    scope: body.scope
                } as Token;
            }

            console.error(`Failed to refresh oauth token (${response.status}): ${JSON.stringify(body)}`);
        }

        this.token = undefined;
        console.log("Token is not expired but might be invalid, getting a new one.");
        return this.getToken();
    }

    configure(instance: AxiosInstance) {
        instance.interceptors.request.use(async config => {
            const token = await this.getToken();
            if (token) {
                config.headers = {
                    ...config.headers,
                    "User-Agent": "Martini Designer",
                    Authorization: "Bearer " + token.accessToken
                };
            }
            return config;
        });
        instance.interceptors.response.use(undefined, async error => {
            if (error.response) {
                const status = error.response.status;
                if (status === 401 && !error.config.retried) {
                    console.error("Got 401 response, refreshing current oauth token");
                    this.token = await this.refreshToken();
                    if (this.token) {
                        error.config.headers["Authorization"] = "Bearer " + this.token.accessToken;
                        console.log("Retrying request");
                        error.config.retried = true;
                        return instance.request(error.config);
                    }
                }
            }

            throw error;
        });
    }
}
