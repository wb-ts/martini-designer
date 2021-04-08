// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
import {Container} from "inversify";
import {CodeFileNameValidator, DefaultResourceNameValidator} from "../../browser/fs/resource-name-validator";
import {MartiniFileSystem} from "../../common/fs/martini-filesystem";
import {MartiniFileSystemNode} from "../../node/fs/node-martini-filesystem";

jest.mock("../../node/fs/node-martini-filesystem");

const container = new Container();
container.bind(DefaultResourceNameValidator).toSelf().inSingletonScope();
container.bind(CodeFileNameValidator).toSelf().inSingletonScope();
container.bind(MartiniFileSystem).toConstantValue(new MartiniFileSystemNode());

const fileSystem: MartiniFileSystem = container.get(MartiniFileSystem);
const defaultValidator = container.get(DefaultResourceNameValidator);
const serviceNameValidator = container.get(CodeFileNameValidator);

beforeEach(() => jest.clearAllMocks());

test("Resource name should not be blank", async () => {
    const result = await defaultValidator.validate("/test/code", " ");
    expect(result).toBe("Cannot be blank.");
});

test("Resource name should be valid", async () => {
    const result = await defaultValidator.validate("/test/code", "blah.gloop");
    expect(result).toBe(true);
});

test("Resource with that name should already exists", async () => {
    // @ts-ignore
    fileSystem.exists.mockReturnValue(true);
    const result = await defaultValidator.validate("/test/code", "blah.gloop");
    expect(result).toBe("A resource with that name already exists.");
    expect(fileSystem.exists).toBeCalledWith("/test/code/blah.gloop");
});

test("Service file name should not be a Java keyword", async () => {
    const result = await serviceNameValidator.validate("/test/code", "while.gloop");
    expect(result).toBe("Cannot use Java keywords as name.");
});

test("Service file name with dots should be valid Java package names", async () => {
    const result = await serviceNameValidator.validate("/test/code", "1test.service.gloop");
    expect(result).toBe("Invalid code directory name '1test'.");
});

test("Service file name should be valid Java class name", async () => {
    const result = await serviceNameValidator.validate("/test/code", "1service.gloop");
    expect(result).toBe("Not a valid name.");
});

test("Service file name should be valid", async () => {
    // @ts-ignore
    fileSystem.exists.mockReturnValue(false);
    const result = await serviceNameValidator.validate("/test/code", "Test.gloop");
    expect(result).toBe(true);
});
