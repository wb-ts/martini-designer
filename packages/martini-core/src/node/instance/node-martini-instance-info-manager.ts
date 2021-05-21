import { injectable, postConstruct } from "inversify";
import {
    MartiniInstanceInfo,
    MartiniInstanceInfoManager,
    MartiniInstanceInfoManagerClient
} from "../../common/instance/martini-instance-info-manager";

@injectable()
export class MartiniInstanceInfoManagerNode
    implements MartiniInstanceInfoManager {
    private client: MartiniInstanceInfoManagerClient | undefined;
    private ready: Promise<void>;
    private info: MartiniInstanceInfo;

    @postConstruct()
    init(): void {
        // TODO read MR properties file to figure out protocol and port
        this.info = {
            address: process.env.MR_ADDRESS || "localhost",
            port: process.env.MR_PORT !== undefined ? Number.parseInt(process.env.MR_PORT) : 8080,
            secured: false
        };
        this.ready = Promise.resolve();
        this.client && this.client.onReady!();
    }

    async get(): Promise<MartiniInstanceInfo> {
        await this.ready;
        return this.info;
    }

    dispose(): void {
    }

    setClient(client: MartiniInstanceInfoManagerClient | undefined): void {
        this.client = client;
    }
}
