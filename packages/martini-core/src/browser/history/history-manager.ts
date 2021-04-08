import { logger } from "@theia/core";

export interface UndoableOperation {
    name?: string;

    execute(): void | boolean;

    undo(): void;

    redo(): void;
}

export class HistoryManager {
    private operations: UndoableOperation[] = [];
    private currentIndex: number = 0;

    execute(op: UndoableOperation) {
        logger.debug("Execute: " + op.name);
        const result = op.execute();
        if (result !== undefined && !result) return;
        if (this.operations.length === 0) this.operations.push(op);
        else {
            this.operations.splice(this.currentIndex + 1, this.operations.length - (this.currentIndex + 1), op);
        }
        this.currentIndex = this.operations.length - 1;
    }

    undo() {
        logger.debug("Undo: " + this.operations[this.currentIndex].name);
        this.operations[this.currentIndex].undo();
        this.currentIndex--;
    }

    canUndo(): boolean {
        return this.operations.length > 0 && this.currentIndex >= 0;
    }

    canRedo(): boolean {
        return this.currentIndex + 1 < this.operations.length;
    }

    redo() {
        this.currentIndex++;
        logger.debug("Redo: " + this.operations[this.currentIndex].name);
        this.operations[this.currentIndex].redo();
    }

    clear() {
        this.operations = [];
        this.currentIndex = 0;
    }
}

export namespace HistoryManager {
    export function execute(op: UndoableOperation, historyManager?: HistoryManager): void {
        if (historyManager) historyManager.execute(op);
        else op.execute();
    }
}

export class ProxyHistoryManager extends HistoryManager {
    proxy: HistoryManager = new HistoryManager();

    execute(op: UndoableOperation) {
        this.proxy.execute(op);
    }

    undo() {
        this.proxy.undo();
    }

    canUndo(): boolean {
        return this.proxy.canUndo();
    }

    canRedo(): boolean {
        return this.proxy.canRedo();
    }

    redo() {
        this.proxy.redo();
    }

    clear() {
        this.proxy.clear();
    }
}

export interface HistoryManagerProvider {
    historyManager: HistoryManager;
}

export namespace HistoryManagerProvider {
    export function is(object: any): object is HistoryManagerProvider {
        return !!object && typeof object === "object" && "historyManager" in object;
    }
}
