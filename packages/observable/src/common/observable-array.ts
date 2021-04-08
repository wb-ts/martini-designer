export class ObservableArray<T> extends Array<T> {
    readonly listeners: ArrayChangeListener<T>[] = [];

    static from<T>(...items: any[]): ObservableArray<T> {
        return new ObservableArray(...items);
    }

    constructor(...items: T[]) {
        super(...items);
        Object.setPrototypeOf(this, ObservableArray.prototype);
    }

    push(...items: T[]): number {
        const length = super.push(...items);
        this.fireEvent({
            source: this,
            type: "add",
            elements: items
        });
        return length;
    }

    splice(start: number, deleteCount: number, ...items: T[]): T[] {
        const deleted = super.splice(start, deleteCount, ...items);
        if (deleted.length > 0)
            this.fireEvent({
                source: this,
                type: "remove",
                elements: deleted
            });
        if (items.length > 0)
            this.fireEvent({
                source: this,
                type: "add",
                elements: items
            });
        return deleted;
    }

    addListener(listener: ArrayChangeListener<T>): { dispose: () => void } {
        this.listeners.push(listener);
        return { dispose: () => this.listeners.splice(this.listeners.indexOf(listener), 1) };
    }

    private fireEvent(event: ArrayChangeEvent<T>) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {}
        });
    }
}

export type ArrayChangeListener<T> = (event: ArrayChangeEvent<T>) => void;
export const ArrayChangeListener = Symbol("ArrayChangeListener");

export interface ArrayChangeEvent<T> {
    readonly source: ObservableArray<T>;
    readonly type: "add" | "remove";
    readonly elements: Array<T>;
}
