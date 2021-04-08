import { injectable, multiInject } from "inversify";
import { ContentAssist } from "./content-assist";

export const ContentAssistContribution = Symbol("ContentAssistContribution");

export interface ContentAssistContribution {
    registerProviders(id: string, contentAssist: ContentAssist): void;
}

@injectable()
export class ContentAssistContributionManager implements ContentAssistContribution {
    @multiInject(ContentAssistContribution)
    private readonly contributions: ContentAssistContribution[];

    registerProviders(id: string, contentAssist: ContentAssist): void {
        this.contributions.forEach(contrib => contrib.registerProviders(id, contentAssist));
    }
}
