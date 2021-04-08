import { ApplyMode } from "../../browser/content-assist/content-assist";

test("Should match apply mode with alt key", () => {
    const applyMode: ApplyMode = {
        name: "Test",
        altKey: true
    };
    expect(
        ApplyMode.matches(applyMode, {
            altKey: true,
            metaKey: false,
            shiftKey: false,
            ctrlKey: false
        } as ApplyMode)
    ).toBe(true);
});

test("Should match apply mode with shift key", () => {
    const applyMode: ApplyMode = {
        name: "Test",
        shiftKey: true
    };
    expect(
        ApplyMode.matches(applyMode, {
            altKey: false,
            metaKey: false,
            shiftKey: true,
            ctrlKey: false
        } as ApplyMode)
    ).toBe(true);
});

test("Should not match apply mode with different key", () => {
    const applyMode: ApplyMode = {
        name: "Test",
        shiftKey: true
    };
    expect(
        ApplyMode.matches(applyMode, {
            altKey: true,
            metaKey: false,
            shiftKey: false,
            ctrlKey: false
        } as ApplyMode)
    ).toBe(false);
});

test("Should not match apply mode with no key", () => {
    const applyMode: ApplyMode = {
        name: "Test",
        shiftKey: true
    };
    expect(
        ApplyMode.matches(applyMode, {
            altKey: false,
            metaKey: false,
            shiftKey: false,
            ctrlKey: false
        } as ApplyMode)
    ).toBe(false);
});

test("Should be no key", () => {
    const applyMode: ApplyMode = {
        name: "Test"
    };
    expect(ApplyMode.noKey(applyMode)).toBe(true);
});

test("Should not be no key", () => {
    const applyMode: ApplyMode = {
        name: "Test",
        altKey: true
    };
    expect(ApplyMode.noKey(applyMode)).toBe(false);
});
