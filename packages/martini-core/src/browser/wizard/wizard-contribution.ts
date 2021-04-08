import { CommandContribution, CommandHandler, CommandRegistry, ContributionProvider } from "@theia/core";
import { KeybindingContribution, KeybindingRegistry } from "@theia/core/lib/browser";
import { inject, injectable, named } from "inversify";
import messages from "martini-messages/lib/messages";
import { Wizard, WizardDialog } from "./wizard";

export const WizardContribution = Symbol("WizardContribution");

export type WizardType = "new" | "import" | "export";

export interface WizardContribution {
    id: string;
    wizardType: WizardType;
    label: string;
    description?: string;
    iconClass?: string;
    primary?: boolean;
    keybinding?: string;
    finishLabel?: string;
    menuGroup?: string;

    createWizard(...args: any[]): Promise<Wizard>;

    isEnabled?(...args: any[]): boolean;

    isVisible?(...args: any[]): boolean;
}

@injectable()
export class WizardCommandContribution implements CommandContribution, KeybindingContribution {
    @inject(ContributionProvider)
    @named(WizardContribution)
    private readonly contributionProvider: ContributionProvider<WizardContribution>;

    registerCommands(commands: CommandRegistry): void {
        this.contributionProvider.getContributions().forEach(wizardContrib => {
            commands.registerCommand(
                {
                    id: WizardCommandContribution.getCommandId(wizardContrib),
                    label: wizardContrib.label,
                    iconClass: wizardContrib.iconClass,
                    category: "Wizard"
                },
                new WizardContribCommandHandler(wizardContrib)
            );
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        this.contributionProvider
            .getContributions()
            .filter(wizardContrib => wizardContrib.keybinding)
            .forEach(wizardContrib => {
                keybindings.registerKeybinding({
                    command: WizardCommandContribution.getCommandId(wizardContrib),
                    keybinding: wizardContrib.keybinding as string
                });
            });
    }

    static getCommandId(wizardContrib: WizardContribution): string {
        return `martini.wizard.${wizardContrib.wizardType}.${wizardContrib.id}`;
    }
}

export class WizardContribCommandHandler implements CommandHandler {
    constructor(private readonly wizardContrib: WizardContribution) {}

    async execute(...args: any[]) {
        const wizard = await this.wizardContrib.createWizard(args);
        const dlg = new WizardDialog(wizard, {
            acceptLabel: this.wizardContrib.finishLabel || messages.create,
            width: wizard.initialSize && wizard.initialSize.width ? wizard.initialSize.width : undefined,
            height: wizard.initialSize && wizard.initialSize.height ? wizard.initialSize.height : undefined
        });
        await dlg.open();
    }

    isEnabled(...args: any[]) {
        return this.wizardContrib.isEnabled ? this.wizardContrib.isEnabled(...args) : true;
    }

    isVisible(...args: any[]) {
        return this.wizardContrib.isVisible ? this.wizardContrib.isVisible(...args) : true;
    }
}
