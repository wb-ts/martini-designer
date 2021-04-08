import { OpenerService, WidgetManager } from "@theia/core/lib/browser";
import { QuickOpenItemOptions, QuickOpenMode } from "@theia/core/lib/common/quick-open-model";
import URI from "@theia/core/lib/common/uri";
import { inject, injectable } from "inversify";
import { Directory, Resource } from "../../../common/fs/martini-filesystem";
import { PartialMartiniPackage } from "../../../common/package/martini-package-manager";
import { FileSearchResult, ResourceSearchResult } from "../../../common/search/resource-search-service";
import { Navigator, NavigatorTreeLabelProvider } from "../../navigator/martini-navigator-view-widget";
import { ResourceSearchResultQuickOpenHandler } from "../../search/resource-search-quick-open";

@injectable()
export class FileSearchResultQuickOpenHandler implements ResourceSearchResultQuickOpenHandler {
    @inject(OpenerService)
    private readonly openerService: OpenerService;
    @inject(NavigatorTreeLabelProvider)
    private readonly labelProvider: NavigatorTreeLabelProvider;
    @inject(WidgetManager)
    private readonly widgetMngr: WidgetManager;

    supports(result: ResourceSearchResult): boolean {
        return FileSearchResult.is(result);
    }

    getOptions(result: FileSearchResult): QuickOpenItemOptions {
        const resource: Resource | Directory = {
            location: result.location,
            name: result.name,
            directory: result.directory,
            lastModified: result.lastModified,
            readOnly: false,
            size: 0,
            children: result.directory ? [] : undefined
        };

        return {
            label: result.location,
            iconClass: this.labelProvider.getIconClass(resource),
            run: mode => {
                if (mode === QuickOpenMode.OPEN || mode === QuickOpenMode.OPEN_IN_BACKGROUND) return this.open(result);
                return false;
            }
        };
    }

    private open(result: ResourceSearchResult): boolean {
        let uri: URI | undefined;
        if (FileSearchResult.is(result)) {
            if (!result.directory) uri = new URI(`martini:/${result.location}`);
            else {
                this.openDir(result);
                return true;
            }
        }
        if (uri) {
            this.openerService.getOpener(uri).then(opener => opener.open(uri!));
            return true;
        }

        return false;
    }

    private async openDir(result: FileSearchResult): Promise<void> {
        const navigator = (await this.widgetMngr.getOrCreateWidget(Navigator.ID)) as Navigator;
        await navigator.model.expandElements(element => {
            if (PartialMartiniPackage.is(element)) return result.location.startsWith(element.name, 1);

            return Resource.is(element) && element.directory && result.location.startsWith(element.location);
        });
        await navigator.model.selectElements(
            element => Resource.is(element) && element.directory && result.location === element.location
        );
        navigator.activate();
    }
}
