import { PreferenceService, Widget } from "@theia/core/lib/browser";
import { Container } from "inversify";
import { ToggleHideFileExtensionHandler } from "../../browser/fs/filesystem-command-handlers";
import { Navigator } from "../../browser/navigator/martini-navigator-view-widget";

const container = new Container();
container.bind(PreferenceService).toConstantValue({
    set: jest.fn(),
    get: jest.fn()
});

container.bind(ToggleHideFileExtensionHandler).toSelf();

describe("ToggleHideFileExtensionHandler", () => {
    beforeAll(() => jest.resetAllMocks());

    const handler = container.get(ToggleHideFileExtensionHandler);

    test("should be visible for navigator widget", () => {
        const nav = new Widget();
        nav.id = Navigator.ID;
        expect(handler.isVisible(nav)).toBe(true);
    });

    test("should be visible for other widgets", () => {
        const widget = new Widget();
        expect(handler.isVisible(widget)).toBe(false);
    });

    test("should toggle the hide file extensions preference", () => {
        const prefService = container.get(PreferenceService) as jest.Mocked<PreferenceService>;
        prefService.get.mockImplementation(() => true);
        handler.execute();
        expect(prefService.set).toBeCalledWith("navigator.hideFileExtensions", false, 1);
    });
});
