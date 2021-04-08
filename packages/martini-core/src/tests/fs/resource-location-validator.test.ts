// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
import {
    CodeFileLocationValidator,
    DefaultResourceLocationValidator
} from "../../browser/fs/resource-location-validator";
import {Container} from "inversify";
import {MartiniFileSystem, Resource} from "../../common/fs/martini-filesystem";
import {MartiniFileSystemNode} from "../../node/fs/node-martini-filesystem";

jest.mock("../../node/fs/node-martini-filesystem");

const container = new Container();
container.bind(DefaultResourceLocationValidator).toSelf().inSingletonScope();
container.bind(CodeFileLocationValidator).toSelf().inSingletonScope();
container.bind(MartiniFileSystem).toConstantValue(new MartiniFileSystemNode());

const fileSystem: MartiniFileSystem = container.get(MartiniFileSystem);
const defaultValidator = container.get(DefaultResourceLocationValidator);
const serviceLocationValidator = container.get(CodeFileLocationValidator);

beforeEach(() => jest.clearAllMocks());

test("Location should exists", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue(undefined);
    const result = await defaultValidator.validate("/test/code");
    expect(result).toBe("Location does not exist.");
});

test("Location should be a directory", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue({
        name: "test.gloop",
        location: "/test/code/test.gloop",
        directory: false,
        lastModified: 0,
        size: 0,
        readOnly: false
    } as Resource);
    const result = await defaultValidator.validate("/test/code/test.gloop");
    expect(result).toBe("Not a directory.");
});

test("Location should not be readonly", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue({
        name: "test",
        location: "/test/code/test",
        directory: true,
        lastModified: 0,
        size: 0,
        readOnly: true
    } as Resource);
    const result = await defaultValidator.validate("/test/code/test");
    expect(result).toBe("Directory is readonly.");
});

test("Location should not be in core package", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue({
        name: "test",
        location: "/core/code/test",
        directory: true,
        lastModified: 0,
        size: 0,
        readOnly: false
    } as Resource);
    const result = await defaultValidator.validate("/test/code/test");
    expect(result).toBe("Directory is readonly.");
});

test("Location should be valid", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue({
        name: "test",
        location: "/test/code/test",
        directory: true,
        lastModified: 0,
        size: 0,
        readOnly: false
    } as Resource);
    const result = await defaultValidator.validate("/test/code/test");
    expect(result).toBe(true);
});

test("Service location should be in code directory", async () => {
    const result = await serviceLocationValidator.validate("/test/web/test");
    expect(result).toBe("Location must be inside the code directory.");
});

test("Service location should be valid", async () => {
    // @ts-ignore
    fileSystem.get.mockReturnValue({
        name: "test",
        location: "/test/code/test",
        directory: true,
        lastModified: 0,
        size: 0,
        readOnly: false
    } as Resource);
    const result = await serviceLocationValidator.validate("/test/code/test");
    expect(result).toBe(true);
});
