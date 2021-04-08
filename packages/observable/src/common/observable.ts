import { ArrayChangeEvent, ArrayChangeListener, ObservableArray } from "./observable-array";

export abstract class Observable {
    static readonly P_CHANGED = "changed";
    private readonly listeners: Map<string | null, PropertyChangeListener[]> = new Map();
    active: boolean = true;

    private readonly propertyChangeListener: PropertyChangeListener = e => this.handlePropertyChange(e);
    private readonly arrayChangeListener: ArrayChangeListener<any> = e => this.handleArrayChange(e);

    constructor() {
        this.addListener(null, this.propertyChangeListener);
    }

    protected observe<T extends Observable>(observable: T): T {
        observable.addListener(Observable.P_CHANGED, this.propertyChangeListener);
        return observable;
    }

    protected unobserve(observable: Observable): boolean {
        return observable.removeListener(Observable.P_CHANGED, this.propertyChangeListener);
    }

    protected observeArray<T extends Observable>(array: ObservableArray<T>): ObservableArray<T> {
        array.listeners.push(this.arrayChangeListener);
        return array;
    }

    protected unobserveArray(array: ObservableArray<Observable>) {
        array.listeners.splice(array.listeners.indexOf(this.arrayChangeListener), 1);
        array.forEach(observable => this.unobserve(observable));
    }

    addListener(propertyName: string | null, listener: PropertyChangeListener): { dispose(): void } {
        this.getListeners(propertyName).push(listener);
        return {
            dispose: () => this.removeListener(propertyName, listener)
        };
    }

    removeListener(propertyName: string | null, listener: PropertyChangeListener): boolean {
        const listeners = this.getListeners(propertyName);
        const index = listeners.findIndex(l => l === listener);
        if (index >= 0) {
            listeners.splice(index, 1);
            return true;
        } else return false;
    }

    firePropertyChange(propertyName: string | null, oldValue: any, newValue: any) {
        if (oldValue instanceof Observable) {
            if (this.unobserve(oldValue)) {
                if (newValue instanceof Observable) this.observe(newValue);
            }
        }

        if (!this.active) return;

        const event: PropertyChangeEvent = {
            source: this,
            sourcePropertyName: propertyName,
            propertyName,
            oldValue,
            newValue
        };

        this.fireEvent(event);
    }

    private getListeners(property: string | null) {
        var listeners = this.listeners.get(property);

        if (listeners === undefined) {
            listeners = [];
            this.listeners.set(property, listeners);
        }

        return listeners;
    }

    private handleArrayChange(e: ArrayChangeEvent<any>) {
        switch (e.type) {
            case "add":
                e.elements.forEach(observable => this.observe(observable));
                break;
            case "remove":
                e.elements.forEach(observable => this.unobserve(observable));
                break;
        }

        this.fireChanged(Observable.P_CHANGED, this, null, e.elements);
    }

    private handlePropertyChange(e: PropertyChangeEvent) {
        if (e.emitter === this && e.propertyName === Observable.P_CHANGED) return;

        this.fireChanged(e.sourcePropertyName as string, e.source, e.oldValue, e.newValue);
    }

    private fireChanged(sourcePropertyName: string, source: any, oldValue: any, newValue: any) {
        if (!this.active) return;

        const event: PropertyChangeEvent = {
            emitter: this,
            source,
            sourcePropertyName,
            propertyName: Observable.P_CHANGED,
            oldValue,
            newValue
        };
        this.fireEvent(event);
    }

    private fireEvent(event: PropertyChangeEvent) {
        const fire = (listener: PropertyChangeListener) => {
            try {
                listener(event);
            } catch (error) {
                console.log("Error calling observable listener");
                console.log(error);
            }
        };
        this.getListeners(null).forEach(fire);
        this.getListeners(event.propertyName).forEach(fire);
    }
}

export type PropertyChangeListener = (event: PropertyChangeEvent) => void;
export const PropertyChangeListener = Symbol("PropertyChangeListener");

export interface PropertyChangeEvent {
    readonly emitter?: any;
    readonly source: any;
    readonly sourcePropertyName: string | null;
    readonly propertyName: string | null;
    readonly oldValue: any;
    readonly newValue: any;
}
