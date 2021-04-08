import {
    QuickOpenContribution,
    QuickOpenHandler,
    QuickOpenHandlerRegistry,
    QuickOpenOptions
} from "@theia/core/lib/browser";
import {
    QuickOpenActionProvider,
    QuickOpenItem,
    QuickOpenItemOptions,
    QuickOpenModel
} from "@theia/core/lib/common/quick-open-model";
import { inject, injectable, multiInject } from "inversify";
import { debounce } from "lodash";
import messages from "martini-messages/lib/messages";
import { ResourceSearchResult, ResourceSearchService } from "../../common/search/resource-search-service";

export const ResourceSearchResultQuickOpenHandler = Symbol("ResourceSearchResultQuickOpenHandler");

export interface ResourceSearchResultQuickOpenHandler {
    supports(result: ResourceSearchResult): boolean;
    getOptions(result: ResourceSearchResult): QuickOpenItemOptions;
}

@injectable()
export class ResourceSearchQuickOpenHandler implements QuickOpenModel, QuickOpenHandler {
    private static readonly DEBOUNCE_TIME = 300;
    readonly prefix = "find ";
    readonly description = messages.resource_search_desc;

    @inject(ResourceSearchService)
    private readonly searchService: ResourceSearchService;
    @multiInject(ResourceSearchResultQuickOpenHandler)
    private readonly handlers: ResourceSearchResultQuickOpenHandler[];

    getModel(): QuickOpenModel {
        return this;
    }

    getOptions(): Partial<QuickOpenOptions.Resolved> {
        return {
            placeholder: messages.resource_search_placeholder
        };
    }

    onType(
        lookFor: string,
        acceptor: (items: QuickOpenItem<QuickOpenItemOptions>[], actionProvider?: QuickOpenActionProvider) => void
    ): void {
        this.doOnType.cancel();
        if (lookFor.trim().length === 0) {
            acceptor([]);
            return;
        }

        this.doOnType(lookFor, acceptor);
    }

    private readonly doOnType = debounce(
        (
            lookFor: string,
            acceptor: (items: QuickOpenItem<QuickOpenItemOptions>[], actionProvider?: QuickOpenActionProvider) => void
        ): void => {
            lookFor = lookFor.toLowerCase();
            this.searchService.search({ query: lookFor }).then(results => {
                const items: QuickOpenItem[] = results
                    .filter((result: any) => result.extension !== "class")
                    .map(result => {
                        const handler = this.handlers.find(handler => handler.supports(result));

                        if (handler) {
                            const options = handler.getOptions(result);
                            if (options.label) {
                                // TODO highlighting should be improved.
                                const index = options.label.toLowerCase().indexOf(lookFor);
                                if (index !== -1)
                                    options.labelHighlights = [
                                        {
                                            start: index,
                                            end: index + lookFor.length
                                        }
                                    ];
                            }
                            return new QuickOpenItem(options);
                        }
                        return undefined;
                    })
                    .filter(item => item)
                    .sort((item1, item2) =>
                        (item1!.getLabel() || "").localeCompare(item2!.getLabel() || "")
                    ) as QuickOpenItem[];
                if (items.length !== 0) acceptor(items);
                else
                    acceptor([
                        new QuickOpenItem({
                            label: messages.no_matches
                        })
                    ]);
            });
        },
        ResourceSearchQuickOpenHandler.DEBOUNCE_TIME
    );
}

@injectable()
export class ResourceSearchQuickOpenContribution implements QuickOpenContribution {
    @inject(ResourceSearchQuickOpenHandler)
    private readonly handler: ResourceSearchQuickOpenHandler;

    registerQuickOpenHandlers(handlers: QuickOpenHandlerRegistry): void {
        handlers.registerHandler(this.handler, true);
        (handlers as any).handlers.delete("...");
    }
}
