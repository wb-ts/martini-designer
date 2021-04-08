import { generateUnique } from "../../common/util/string";

test("Should generate unique name in array", () => {
    const actual = generateUnique(["a"], "a");
    expect(actual).toBe("a1");
});

test("Should return initial value", () => {
    const actual = generateUnique(["b"], "a");
    expect(actual).toBe("a");
});
