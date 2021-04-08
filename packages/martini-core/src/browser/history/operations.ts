import { UndoableOperation } from "./history-manager";

export class BatchOperation implements UndoableOperation {
    constructor(readonly name: string | undefined, readonly operations: UndoableOperation[]) {}

    execute(): void {
        this.operations.forEach(op => op.execute());
    }

    undo(): void {
        this.operations
            .slice()
            .reverse()
            .forEach(op => op.undo());
    }

    redo(): void {
        this.operations.forEach(op => op.redo());
    }

    static make(name?: string): BatchOperation.Builder {
        return new BatchOperation.Builder(name);
    }
}

export namespace BatchOperation {
    export class Builder {
        operations: UndoableOperation[] = [];

        constructor(readonly name?: string | undefined) {}

        add(...op: UndoableOperation[]) {
            this.operations.push(...op);
        }

        build(): BatchOperation {
            return new BatchOperation(
                this.operations.length == 1 && !this.name ? this.operations[0].name : this.name,
                this.operations
            );
        }
    }
}

export class ModifyArrayOperation<T> implements UndoableOperation {
    private index = -1;

    private constructor(
        readonly array: Array<T>,
        readonly element: T,
        readonly type: "add" | "remove",
        index?: number,
        readonly name?: string
    ) {
        if (index !== undefined) this.index = index;
    }

    static add<T>(array: Array<T>, element: T, name?: string): ModifyArrayOperation<T> {
        return new ModifyArrayOperation(array, element, "add", undefined, name);
    }

    static insert<T>(array: Array<T>, element: T, index: number, name?: string): ModifyArrayOperation<T> {
        return new ModifyArrayOperation(array, element, "add", index, name);
    }

    static remove<T>(array: Array<T>, element: T, name?: string): ModifyArrayOperation<T> {
        return new ModifyArrayOperation(array, element, "remove", undefined, name);
    }

    execute(): void {
        if (this.type === "remove") this.index = this.array.indexOf(this.element);
        this.redo();
        if (this.type === "add" && this.index === -1) this.index = this.array.indexOf(this.element);
    }

    undo(): void {
        if (this.type === "add") this.array.splice(this.index, 1);
        else {
            this.array.splice(this.index, 0, this.element);
        }
    }

    redo(): void {
        if (this.type === "add") {
            if (this.index == -1) this.array.push(this.element);
            else this.array.splice(this.index, 0, this.element);
        } else {
            this.array.splice(this.index, 1);
        }
    }
}

export class SetPropertyOperation implements UndoableOperation {
    oldValue: any;

    constructor(readonly target: any, readonly property: string, readonly value: any, readonly name?: string) {}

    execute(): void {
        this.oldValue = this.target[this.property];
        this.redo();
    }

    undo(): void {
        this.target[this.property] = this.oldValue;
    }

    redo(): void {
        this.target[this.property] = this.value;
    }
}
