import {ModifyArrayOperation, SetPropertyOperation} from "../../browser/history/operations";

test("ModifyArrayOperation.add", () => {
    const array = [1, 2, 3];
    const op = ModifyArrayOperation.add(array, 4);
    op.execute();
    expect(array).toEqual([1, 2, 3, 4]);
    op.undo();
    expect(array).toEqual([1, 2, 3]);
    op.redo();
    expect(array).toEqual([1, 2, 3, 4]);
});

test("ModifyArrayOperation.insert", () => {
    const array = [1, 3, 4];
    const op = ModifyArrayOperation.insert(array, 2, 1);
    op.execute();
    expect(array).toEqual([1, 2, 3, 4]);
    op.undo();
    expect(array).toEqual([1, 3, 4]);
    op.redo();
    expect(array).toEqual([1, 2, 3, 4]);
});

test("ModifyArrayOperation.remove middle element", () => {
    const array = [1, 2, 3];
    const op = ModifyArrayOperation.remove(array, 2);
    op.execute();
    expect(array).toEqual([1, 3]);
    op.undo();
    expect(array).toEqual([1, 2, 3]);
    op.redo();
    expect(array).toEqual([1, 3]);
});

test("ModifyArrayOperation.remove first element", () => {
    const array = [1, 2, 3];
    const op = ModifyArrayOperation.remove(array, 1);
    op.execute();
    expect(array).toEqual([2, 3]);
    op.undo();
    expect(array).toEqual([1, 2, 3]);
    op.redo();
    expect(array).toEqual([2, 3]);
});

test("ModifyArrayOperation.remove last element", () => {
    const array = [1, 2, 3];
    const op = ModifyArrayOperation.remove(array, 3);
    op.execute();
    expect(array).toEqual([1, 2]);
    op.undo();
    expect(array).toEqual([1, 2, 3]);
    op.redo();
    expect(array).toEqual([1, 2]);
});

test("SetPropertyOperation", () => {
    const target = {
        test: "test"
    };

    const op = new SetPropertyOperation(target, "test", "modified");

    op.execute();
    expect(target).toEqual({test: "modified"});
    op.undo();
    expect(target).toEqual({test: "test"});
    op.redo();
    expect(target).toEqual({test: "modified"});
});

test("SetPropertyOperation with setter/getter", () => {
    const target = new Dummy();

    const op = new SetPropertyOperation(target, "test", "modified");

    op.execute();
    expect(target.test).toEqual("modified");
    op.undo();
    expect(target.test).toEqual("test");
    op.redo();
    expect(target.test).toEqual("modified");
});

class Dummy {
    private _test = "test";
    set test(test: string) {
        this._test = test;
    }

    get test() {
        return this._test;
    }
}
