import { Path } from "@theia/core";
import { promises as fs } from "fs";
import { injectable } from "inversify";
import * as os from "os";
import { UserStorageService } from "./user-storage-service";

export const USER_STORAGE_FOLDER = ".martini-ide";

@injectable()
export class UserStorageServiceFilesystemImpl implements UserStorageService {
    protected readonly userStorageDir: Path;

    constructor() {
        const homeDir = os.homedir();
        this.userStorageDir = new Path(homeDir).join(USER_STORAGE_FOLDER);
    }

    async readContents(path: string): Promise<string> {
        const uri = this.userStorageDir.join(path).toString();
        try {
            await fs.access(uri);
        } catch (error) {
            return "";
        }
        const buffer = await fs.readFile(uri);

        return buffer.toString("utf-8");
    }

    async saveContents(path: string, content: string): Promise<void> {
        const uri = this.userStorageDir.join(path);
        await fs.writeFile(uri.toString(), content, {
            encoding: "utf-8"
        });
    }
}
