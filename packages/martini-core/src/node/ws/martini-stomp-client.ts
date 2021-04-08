import { Client, Versions } from "@stomp/stompjs";
import { Disposable } from "@theia/core";
import { inject, injectable, postConstruct } from "inversify";
import * as encoding from "text-encoding";
import * as WebSocket from "ws";
import { MartiniInstanceInfoManager } from "../../common/instance/martini-instance-info-manager";
import { AuthService } from "../instance/auth/auth-service";

export const MartiniStompClient = Symbol("MartiniStompClient");

export interface MartiniStompClient {
    subscribe(destination: string, handler: MessageHandler): Promise<Disposable>;

    send(destination: string, headers: any, body: any): Promise<void>;
}

export type MessageHandler = (headers: any, body: any) => void;

@injectable()
export class MartiniStompClientNode implements MartiniStompClient {
    static readonly HEARTBEAT = 10000;

    @inject(AuthService)
    private readonly authService: AuthService;
    @inject(MartiniInstanceInfoManager)
    private readonly instanceInfoManager: MartiniInstanceInfoManager;

    private client: Client | undefined;

    @postConstruct()
    protected init() {
        Object.assign(global, { WebSocket: require("ws") });

        // remove if NodeJS version >= 11
        if (typeof TextEncoder !== "function") {
            Object.assign(global, {
                TextEncoder: encoding.TextEncoder,
                TextDecoder: encoding.TextDecoder
            });
        }
    }

    async subscribe(destination: string, handler: MessageHandler): Promise<Disposable> {
        const client = await this.getStompClient();
        const sub = client.subscribe(destination, message => {
            handler(message.headers, message.body);
        });
        console.log(`Stomp client subscribed to ${destination}`);
        return Disposable.create(() => sub.unsubscribe());
    }

    async send(destination: string, headers?: any, body?: any): Promise<void> {
        const client = await this.getStompClient();
        client.publish({
            destination,
            headers,
            body
        });
    }

    private async getStompClient(): Promise<Client> {
        if (this.client) return this.client;
        const instance = await this.instanceInfoManager.get();
        const token = await this.authService.getToken();
        if (!token) throw new Error(`Failed to get oauth token in order to connect stomp client`);

        const address = instance.port > 0 ? `${instance.address}:${instance.port}` : instance.address;
        const headers = {
            Authorization: "Bearer " + token.accessToken
        };
        const url = `${instance.secured ? "wss" : "ws"}://${address}/martini-ws/websocket`;

        const _client = new Client({
            brokerURL: url,
            webSocketFactory: () => new WebSocket(url, { headers }),
            debug: msg => console.debug(msg),
            stompVersions: new Versions(["1.1"]),
            reconnectDelay: 5000,
            logRawCommunication: true,
            heartbeatIncoming: MartiniStompClientNode.HEARTBEAT,
            heartbeatOutgoing: MartiniStompClientNode.HEARTBEAT
        });
        this.client = _client;

        const promise: Promise<Client> = new Promise((resolve, reject) => {
            _client.onConnect = () => {
                console.debug("Stomp client connected successfully");
                resolve(this.client);
            };
            _client.onWebSocketError = event => {
                console.error("Websocket error:");
                // @ts-ignore
                console.error(event.error);
            };
            _client.onStompError = frame => {
                console.error("Stomp client error:");
                console.error(frame);
                reject(frame);
            };
        });

        this.client.activate();

        return promise;
    }
}
