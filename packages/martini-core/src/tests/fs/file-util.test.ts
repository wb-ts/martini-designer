import URI from "@theia/core/lib/common/uri";
import {
    codeDirRegExp,
    codeDirResourceRegExp,
    corePackageResourceRegExp,
    filterByParentDir,
    getNamespace,
    getPackageRelativePath,
    isModifiable,
    isParent,
    isResourceArray,
    packageDirRegExp,
    withoutFileExtension,
    withoutScheme
} from "../../common/fs/file-util";
import { Resource } from "../../common/fs/martini-filesystem";
import { isValidJavaPackageName } from "../../common/util/java";

test("resource is filtered out if a parent directory is in the array", () => {
    const resources: Resource[] = [
        {
            name: "test",
            location: "/examples/code/test",
            directory: true,
            lastModified: 0,
            readOnly: false,
            size: 0
        },
        {
            location: "/examples/code/test/Test.gloop",
            name: "Test.gloop",
            directory: false,
            lastModified: 0,
            readOnly: false,
            size: 0
        }
    ];

    const result = filterByParentDir(resources);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
        name: "test",
        location: "/examples/code/test",
        directory: true,
        lastModified: 0,
        readOnly: false,
        size: 0
    });
});

test("resource is not filtered out if no parent directory is in the array", () => {
    const resources: Resource[] = [
        {
            name: "test",
            location: "/examples/code/other",
            directory: true,
            lastModified: 0,
            readOnly: false,
            size: 0
        },
        {
            location: "/examples/code/test/Test.gloop",
            name: "Test.gloop",
            directory: false,
            lastModified: 0,
            readOnly: false,
            size: 0
        }
    ];

    const result = filterByParentDir(resources);
    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({
        name: "test",
        location: "/examples/code/other",
        directory: true,
        lastModified: 0,
        readOnly: false,
        size: 0
    });
    expect(result[1]).toMatchObject({
        location: "/examples/code/test/Test.gloop",
        name: "Test.gloop",
        directory: false,
        lastModified: 0,
        readOnly: false,
        size: 0
    });
});

test("Readonly resource should not be modifiable", () => {
    const resource: Resource = {
        name: "test",
        readOnly: true,
        directory: false,
        lastModified: 0,
        location: "test",
        size: 0
    };
    expect(isModifiable(resource)).toBe(false);
});

test("Not readonly resource should be modifiable", () => {
    const resource: Resource = {
        name: "test",
        readOnly: false,
        directory: false,
        lastModified: 0,
        location: "test",
        size: 0
    };
    expect(isModifiable(resource)).toBe(true);
});

test("Code directory should not be modifiable", () => {
    const resource: Resource = {
        name: "code",
        readOnly: false,
        directory: true,
        lastModified: 0,
        location: "/test/code",
        size: 0
    };
    expect(isModifiable(resource)).toBe(false);
});

test("Any core package resource should not be modifiable", () => {
    const resource: Resource = {
        name: "test.model",
        readOnly: false,
        directory: false,
        lastModified: 0,
        location: "/core/code/test.model",
        size: 0
    };
    expect(isModifiable(resource)).toBe(false);
});

test("Directory should be parent of file", () => {
    const parent: Resource = {
        name: "code",
        readOnly: false,
        directory: true,
        lastModified: 0,
        location: "/test/code",
        size: 0
    };
    const child: Resource = {
        name: "test.gloop",
        readOnly: false,
        directory: false,
        lastModified: 0,
        location: "/test/code/test.gloop",
        size: 0
    };
    expect(isParent(parent, child)).toBe(true);
});

test("Directory should not be parent of file from another directory", () => {
    const parent: Resource = {
        name: "test",
        readOnly: false,
        directory: true,
        lastModified: 0,
        location: "/test/code/test",
        size: 0
    };
    const child: Resource = {
        name: "test.gloop",
        readOnly: false,
        directory: false,
        lastModified: 0,
        location: "/test/code/test.gloop",
        size: 0
    };
    expect(isParent(parent, child)).toBe(false);
});

test("Should be a Resource array", () => {
    const resource: Resource = {
        name: "test.model",
        readOnly: false,
        directory: false,
        lastModified: 0,
        location: "/core/code/test.model",
        size: 0
    };
    const array = [resource, resource];
    expect(isResourceArray(array)).toBe(true);
});

test("Should not be a Resource array", () => {
    const array = ["test", 1];
    expect(isResourceArray(array)).toBe(false);
});

test("Code directory path should match regexp", () => {
    expect(codeDirRegExp.test("/test/code")).toBe(true);
});

test("Code directory path should match regexp with trailing /", () => {
    expect(codeDirRegExp.test("/test/code/")).toBe(true);
});

test("Not code directory path should not match regexp", () => {
    expect(codeDirRegExp.test("/test/code/test")).toBe(false);
});

test("Code resource path should match regexp", () => {
    expect(codeDirResourceRegExp.test("/test/code/test.gloop")).toBe(true);
});

test("Not code resource path should not match regexp", () => {
    expect(codeDirResourceRegExp.test("/test/web/index.html")).toBe(false);
});

test("core package resource path should match regexp", () => {
    expect(corePackageResourceRegExp.test("/core/code/test.gloop")).toBe(true);
});

test("Not core package resource path should not match regexp", () => {
    expect(corePackageResourceRegExp.test("/test/web/index.html")).toBe(false);
});

describe("Validate Java package name", () => {
    test.each([
        ["underscored_name", true],
        ["hyphanated-name", false],
        ["int_", true],
        ["int", false],
        ["_123name", true],
        ["123name", false]
    ])("%p", (name: string, expected: boolean) => {
        expect(isValidJavaPackageName(name)).toBe(expected);
    });
});

describe("Martini package path regex", () => {
    test.each([
        ["/test", true],
        ["/test/code", false]
    ])("%p", (path: string, expected: boolean) => {
        expect(packageDirRegExp.test(path)).toBe(expected);
    });
});

test("Should return correct package name and relative path", () => {
    const expected = {
        packageName: "test",
        relativePath: "code/dir1/dir2"
    };
    const actual = getPackageRelativePath("/test/code/dir1/dir2");
    expect(expected).toMatchObject(actual);
});

test("Code directory path should return namespace", () => {
    expect(getNamespace("/test/code/com/petstore")).toBe("com.petstore");
});

test("Code directory path with Gloop service should return namespace without file extension", () => {
    expect(getNamespace("/test/code/com/petstore/GetPetById.gloop")).toBe("com.petstore.GetPetById");
});

test("Web directory path should not transform into namespace", () => {
    expect(getNamespace("/test/web/com/petstore")).toBe("");
});

test("Should return the URI as string without the scheme", () => {
    const uri = new URI("martini://examples/code/Test.gloop");
    expect(withoutScheme(uri)).toBe("/examples/code/Test.gloop");
});

test("Should return the file name without the extension", () => {
    expect(withoutFileExtension("test.gloop")).toBe("test");
});

test("Should return the file name with multiple dots without the extension", () => {
    expect(withoutFileExtension("my.test.gloop")).toBe("my.test");
});
