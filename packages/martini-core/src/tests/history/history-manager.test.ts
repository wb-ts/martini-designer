import { HistoryManager, UndoableOperation } from "../../browser/history/history-manager";

test("history manager can undo/redo", () => {
    const manager = new HistoryManager();
    manager.execute(new DummyOp());
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
    manager.undo();
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);
    manager.redo();
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
});

test("history manager can undo multi operations", () => {
    const manager = new HistoryManager();
    manager.execute(new DummyOp("op 1"));
    manager.execute(new DummyOp("op 2"));
    expect(manager.canUndo()).toBe(true);
    manager.undo();
    expect(manager.canUndo()).toBe(true);
    manager.undo();
    expect(manager.canUndo()).toBe(false);
});

class DummyOp implements UndoableOperation {
    constructor(readonly name?: string) {}

    execute(): void {
        // no-op
    }

    undo(): void {
        // no-op
    }

    redo(): void {
        // no-op
    }
}
