require("reflect-metadata"); // has to stay at the top

import { CommandRegistry, SelectionService } from "@theia/core";
import { ApplicationShell } from "@theia/core/lib/browser/shell/application-shell";
import { Container, decorate, injectable } from "inversify";
import { ConfirmDialog } from "../browser/dialogs/dialogs";
import { ProgressService } from "../browser/progress/progress-service";

jest.mock("@theia/core/lib/browser/shell/application-shell");
decorate(injectable(), ApplicationShell);

export const makeContainerForCommandTest = (contribs: any[], configure?: (container: Container) => void): Container => {
    jest.mock("../browser/dialogs/dialogs.tsx");

    ConfirmDialog.prototype.open = async () => true;

    const container = new Container();
    container.bind(ProgressService).toConstantValue({
        showProgress: (_, task: any) =>
            task({
                isCancelled: () => false,
                report: (_: any) => {}
            })
    } as ProgressService);
    container
        .bind(ApplicationShell)
        .toSelf()
        .inSingletonScope();
    container
        .bind(SelectionService)
        .toSelf()
        .inSingletonScope();
    contribs.forEach(contrib =>
        container
            .bind(contrib)
            .toSelf()
            .inSingletonScope()
    );
    container.bind(CommandRegistry).toConstantValue(
        new CommandRegistry({
            getContributions: () => contribs.map(contrib => container.get(contrib))
        })
    );

    if (configure) configure(container);

    container.get(CommandRegistry).onStart();

    return container;
};
