require("reflect-metadata");
import { OpenerService, OpenHandler, QuickOpenMode, WidgetManager } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { Container } from "inversify";
import { FileSearchResultQuickOpenHandler } from "../../../browser/fs/search/file-search-result-quick-open-handler";
import { NavigatorTreeLabelProvider } from "../../../browser/navigator/martini-navigator-view-widget";

jest.mock("../../../browser/navigator/martini-navigator-view-widget");
jest.mock("@theia/core/lib/browser/widget-manager");

const container = new Container();
//@ts-ignore
container.bind(NavigatorTreeLabelProvider).toConstantValue(new NavigatorTreeLabelProvider());
container.bind(WidgetManager).toConstantValue(new WidgetManager());
container.bind(FileSearchResultQuickOpenHandler).toSelf();
const mockOpenerService: OpenerService = {
    getOpener: jest.fn(),
    getOpeners: jest.fn()
};
container.bind(OpenerService).toConstantValue(mockOpenerService);
const handler = container.get(FileSearchResultQuickOpenHandler);

beforeEach(() => jest.clearAllMocks());

test("Should support FileSearchResult", () => {
    const actual = handler.supports({
        type: "path",
        location: "test"
    });
    expect(actual).toBe(true);
});

test("Should not support unknown SearchResult", () => {
    const actual = handler.supports({
        //@ts-ignore
        type: "test",
        location: "test"
    });
    expect(actual).toBe(false);
});

test("Should return QuickOpenItemOptions", () => {
    const actual = handler.getOptions({
        directory: false,
        lastModified: 0,
        extension: "gloop",
        name: "Test.gloop",
        location: "/test/code/Test.gloop",
        type: "path"
    });
    expect(actual).toMatchSnapshot();
});

test("Should open the file", done => {
    const options = handler.getOptions({
        directory: false,
        lastModified: 0,
        extension: "gloop",
        name: "Test.gloop",
        location: "/test/code/Test.gloop",
        type: "path"
    });
    const mockOpener: OpenHandler = {
        id: "mock",
        canHandle: () => 1,
        open: jest.fn(async () => {
            expect(mockOpenerService.getOpener).toBeCalledTimes(1);
            expect(mockOpenerService.getOpener).toBeCalledWith(new URI("martini://test/code/Test.gloop"));
            expect(mockOpener.open).toBeCalledTimes(1);
            expect(mockOpener.open).toBeCalledWith(new URI("martini://test/code/Test.gloop"));
            done();
        })
    };
    mockOpenerService.getOpener = jest.fn(async () => mockOpener);
    const result = options.run?.(QuickOpenMode.OPEN);
    expect(result).toBe(true);
});
