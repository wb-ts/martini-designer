import { DisposableCollection, Emitter, MaybePromise, SelectionService } from "@theia/core";
import { ApplicationShell, Message, ReactWidget, Saveable, Widget } from "@theia/core/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { HistoryManager, HistoryManagerProvider } from "../history/history-manager";
import { PropertiesViewPage, PropertiesViewPageProvider } from "./properties-view-page";

@injectable()
export class PropertiesViewWidget extends ReactWidget implements HistoryManagerProvider {
    static readonly ID = "martini-core:properties-view";

    private currentProvider: PropertiesViewPageProvider | undefined;
    private page: PropertiesViewPage | undefined;
    private historyManagerProvider: HistoryManagerProvider | undefined;
    private pageDisposables = new DisposableCollection();

    constructor(
        @inject(SelectionService)
        readonly selectionService: SelectionService,
        @inject(ApplicationShell)
        readonly applicationShell: ApplicationShell
    ) {
        super();
        this.toDispose.push(selectionService.onSelectionChanged(() => this.handleSelectionChanged()));
        this.toDispose.push(applicationShell.onDidChangeCurrentWidget(() => this.handleCurrentWidgetChanged()));
    }

    @postConstruct()
    init() {
        this.id = PropertiesViewWidget.ID;
        this.title.label = messages.properties;
        this.title.caption = messages.properties;
        this.title.closable = false;
        this.title.iconClass = "martini-tab-icon martini-properties-icon";
        this.node.tabIndex = -1;
        this.handleCurrentWidgetChanged();
    }

    protected render(): React.ReactNode {
        if (this.page)
            return <div style={{ overflowY: "hidden", height: "100%" }}>{this.page.render()}</div>;
        else
            return <NoPropertiesLabel />;
    }

    /**
     * These two properties are necessary to not cause errors
     * and still have the "save" function called.
     */
    dirty = false;
    onDirtyChanged = new Emitter().event;

    save(): MaybePromise<void> {
        if (Saveable.is(this.currentProvider))
            return this.currentProvider.save();
    }

    get historyManager() {
        return this.historyManagerProvider ? this.historyManagerProvider.historyManager : new HistoryManager();
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.update();
    }

    onActivateRequest(msg: Message) {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    private handleCurrentWidgetChanged() {
        if (this.applicationShell.currentWidget === this)
            return;

        const currentWidget = this.applicationShell.currentWidget;
        this.page = undefined;
        this.pageDisposables.dispose();

        if (PropertiesViewPageProvider.is(currentWidget)) {
            this.currentProvider = currentWidget;
            this.page = currentWidget.getPropertiesViewPage();
            this.pageDisposables.push(this.page.onChange(() => this.update()));
            this.page.onSelectionChange(currentWidget, this.selectionService.selection);

            if (HistoryManagerProvider.is(currentWidget))
                this.historyManagerProvider = currentWidget;
        }
        else {
            this.currentProvider = undefined;
            this.historyManagerProvider = undefined;
        }

        this.update();
    }

    private handleSelectionChanged() {
        if (this.applicationShell.currentWidget === this)
            return;
        this.page?.onSelectionChange(this.applicationShell.currentWidget!, this.selectionService.selection);
        this.update();
    }
}

export const NoPropertiesLabel: React.FC = () => (<div style={{ display: "grid", height: "100%", justifyItems: "center" }}>
    <h4 style={{ alignSelf: "center" }}>{messages.no_props_to_display}</h4>
</div>);
