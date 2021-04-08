import { Container } from "inversify";
import "reflect-metadata";
import {
    ResourceSearchQuickOpenHandler,
    ResourceSearchResultQuickOpenHandler
} from "../../browser/search/resource-search-quick-open";
import { ResourceSearchResult, ResourceSearchService } from "../../common/search/resource-search-service";
import { ResourceSearchServiceNode } from "../../node/search/node-resource-search-service";

jest.mock("../../node/search/node-resource-search-service");

const container = new Container();
container.bind(ResourceSearchQuickOpenHandler).toSelf();
const mockResourceSearchService = new ResourceSearchServiceNode();
container.bind(ResourceSearchService).toConstantValue(mockResourceSearchService);
const mockHandler: ResourceSearchResultQuickOpenHandler = {
    getOptions: jest.fn((result: ResourceSearchResult) => ({
        label: result.location
    })),
    supports: jest.fn()
};
container.bind(ResourceSearchResultQuickOpenHandler).toConstantValue(mockHandler);
const handler = container.get(ResourceSearchQuickOpenHandler);

beforeEach(() => jest.clearAllMocks());

test("Should return options", () => {
    const options = handler.getOptions();
    expect(options).toMatchSnapshot();
});

test("Should return no results", done => {
    (mockResourceSearchService.search as jest.Mock).mockResolvedValue([]);
    const accept = jest.fn(_items => {
        expect(mockResourceSearchService.search).toBeCalledTimes(1);
        expect(mockResourceSearchService.search).toBeCalledWith({ query: "test" });
        expect(accept).toBeCalledTimes(1);
        expect(accept.mock.calls[0][0]).toMatchSnapshot();
        done();
    });
    handler.onType("test", accept);
});

test("Should return items", done => {
    (mockResourceSearchService.search as jest.Mock).mockResolvedValue([
        {
            type: "path",
            location: "test1"
        },
        {
            type: "path",
            location: "test2"
        }
    ] as ResourceSearchResult[]);
    (mockHandler.supports as jest.Mock).mockReturnValue(true);
    const accept = jest.fn(_items => {
        expect(mockResourceSearchService.search).toBeCalledTimes(1);
        expect(mockResourceSearchService.search).toBeCalledWith({ query: "test" });
        expect(accept).toBeCalledTimes(1);
        expect(accept.mock.calls[0][0]).toMatchSnapshot();
        done();
    });
    handler.onType("test", accept);
});

test("Should not return items", done => {
    (mockResourceSearchService.search as jest.Mock).mockResolvedValue([
        {
            type: "path",
            location: "test1"
        },
        {
            type: "path",
            location: "test2"
        }
    ] as ResourceSearchResult[]);
    (mockHandler.supports as jest.Mock).mockReturnValue(false);
    const accept = jest.fn(_items => {
        expect(mockResourceSearchService.search).toBeCalledTimes(1);
        expect(mockResourceSearchService.search).toBeCalledWith({ query: "test" });
        expect(accept).toBeCalledTimes(1);
        expect(accept.mock.calls[0][0]).toMatchSnapshot();
        done();
    });
    handler.onType("test", accept);
});
