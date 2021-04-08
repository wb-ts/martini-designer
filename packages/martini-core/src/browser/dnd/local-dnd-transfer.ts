export class LocalDnDTransfer {
    static readonly INSTANCE: LocalDnDTransfer = new LocalDnDTransfer();

    private _elements: any[] | undefined;

    get elements(): any[] | undefined {
        return this._elements;
    }

    set elements(elements: any[] | undefined) {
        this._elements = elements;
    }
}
