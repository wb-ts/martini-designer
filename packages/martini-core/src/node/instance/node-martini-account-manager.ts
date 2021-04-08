import {MartiniAccountManager, MartiniAccountManagerClient} from "../../common/instance/martini-account-manager";
import {Emitter} from "@theia/core";
import {inject, injectable, postConstruct} from "inversify";
import {UserStorageService} from "../storage/user-storage-service";

@injectable()
export class MartiniAccountManagerNode implements MartiniAccountManager {
    static readonly STORAGE_PATH = "martini-account.json";

    @inject(UserStorageService) userStorage: UserStorageService;

    private client: MartiniAccountManagerClient | undefined;
    private account: Account;

    private readonly onUpdatedEmitter = new Emitter<string>();
    readonly onUpdated = this.onUpdatedEmitter.event;
    private ready: Promise<void>;

    @postConstruct()
    init() {
        this.ready = this.userStorage
        .readContents(MartiniAccountManagerNode.STORAGE_PATH)
        .then(contents => {
            if (contents && contents.trim().length !== 0)
                this.account = JSON.parse(contents) as Account;
            this.client && this.client.onReady!();
        });
    }

    async getAccountName(): Promise<string> {
        await this.ready;
        return this.account?.name;
    }

    async getPassword(): Promise<string | undefined> {
        await this.ready;
        return this.account.password;
    }

    async set(name: string, password: string): Promise<void> {
        await this.ready;
        this.account = {name, password};
        this.userStorage.saveContents(
            MartiniAccountManagerNode.STORAGE_PATH,
            JSON.stringify(this.account)
        );
    }

    dispose(): void {
    }

    setClient(client: MartiniAccountManagerClient | undefined): void {
        this.client = client;
    }
}

interface Account {
    name: string;
    password: string;
}
