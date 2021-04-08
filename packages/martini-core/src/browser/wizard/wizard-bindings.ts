import { bindContributionProvider, CommandContribution } from "@theia/core";
import { KeybindingContribution } from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import { WizardCommandContribution, WizardContribution } from "./wizard-contribution";

export const bindWizardBindings = (bind: interfaces.Bind) => {
    bindContributionProvider(bind, WizardContribution);
    bind(WizardCommandContribution)
        .toSelf()
        .inSingletonScope();
    bind(CommandContribution).toService(WizardCommandContribution);
    bind(KeybindingContribution).toService(WizardCommandContribution);
};
