export const UserStorageService = Symbol("UserStorageService");

export interface UserStorageService {
    readContents(path: string): Promise<string>;

    saveContents(path: string, content: string): Promise<void>;
}
