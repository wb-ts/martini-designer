import { MessageService, Progress as TheiaProgress, ProgressMessage } from "@theia/core";
import { inject, injectable } from "inversify";

export const ProgressService = Symbol("ProgressService");

export interface ProgressService {
    showProgress<T>(message: ProgressMessage | string, task: (progress: Progress) => Promise<T>): Promise<T>;
}

export interface Progress extends TheiaProgress {
    isCancelled(): boolean;
}

@injectable()
export class DefaultProgressService implements ProgressService {
    @inject(MessageService) messageService: MessageService;

    async showProgress<T>(message: ProgressMessage | string, task: (progress: Progress) => Promise<T>): Promise<T> {
        let cancelled = false;
        const theiaProgress = await this.messageService.showProgress(
            typeof message === "string" ? { text: message } : message,
            () => (cancelled = true)
        );
        const progress = {
            ...theiaProgress,
            isCancelled() {
                return cancelled;
            }
        };
        try {
            return await task(progress);
        } finally {
            progress.cancel();
        }
    }
}
