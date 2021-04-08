import { QuickOpenContribution } from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import { FileSearchResultQuickOpenHandler } from "../fs/search/file-search-result-quick-open-handler";
import {
    ResourceSearchQuickOpenContribution,
    ResourceSearchQuickOpenHandler,
    ResourceSearchResultQuickOpenHandler
} from "./resource-search-quick-open";

export const bindResourceSearchBindings = (bind: interfaces.Bind) => {
    bind(QuickOpenContribution)
        .to(ResourceSearchQuickOpenContribution)
        .inSingletonScope();
    bind(ResourceSearchQuickOpenHandler)
        .toSelf()
        .inSingletonScope();
    bind(ResourceSearchResultQuickOpenHandler)
        .to(FileSearchResultQuickOpenHandler)
        .inSingletonScope();
};
