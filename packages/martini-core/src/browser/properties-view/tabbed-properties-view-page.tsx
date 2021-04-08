import { Widget } from "@phosphor/widgets";
import { DisposableCollection } from "@theia/core";
import { injectable, multiInject } from "inversify";
import * as React from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { AbstractPropertiesViewPage } from "./properties-view-page";
import { PropertiesViewTab } from "./properties-view-tab";
import { NoPropertiesLabel } from "./properties-view-widget";

/**
 * PropertiesViewWidget page which can display other pages in tabs. To add a tab to this page, one has to bind a
 * PropertiesViewTab.
 */
@injectable()
export class TabbedPropertiesViewPage extends AbstractPropertiesViewPage {

    @multiInject(PropertiesViewTab)
    private tabs: PropertiesViewTab[];
    private visibleTabs: PropertiesViewTab[] = [];
    private tabDisposables = new DisposableCollection();
    title = undefined;
    iconClass = undefined;
    protected selectedTabIndex: number = 0;
    scrollY = false;

    onSelectionChange(source: Widget, selection: object): void {
        this.tabDisposables.dispose();
        this.visibleTabs = this.tabs
            .filter(tab => tab.isVisible(selection))
            .sort((tab1, tab2) => tab1.order - tab2.order);
        if (this.selectedTabIndex >= this.visibleTabs.length)
            this.selectedTabIndex = 0;
        this.visibleTabs.forEach((tab, i) => {
            tab.onSelectionChange(source, selection);
            this.tabDisposables.push(tab.onChange(() => {
                // Only re render the active tab
                if (this.selectedTabIndex === i)
                    this.onChangeEmitter.fire();
            }));
        });
    }

    render(): React.ReactNode {
        if (this.visibleTabs.length === 0)
            return <NoPropertiesLabel />;

        return <Tabs
            onKeyPress={e => this.handleKeyPressed(e)}
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%"
            }}
            selectedIndex={this.selectedTabIndex}
            onSelect={(index => this.handleSelect(index))}
            forceRenderTabPanel={true}
        >
            {this.visibleTabs.map(tab => (
                <TabPanel key={tab.name} style={{
                    margin: 5,
                    flex: 1,
                    overflowY: "auto"
                }}>
                    {tab.render()}
                </TabPanel>))}
            <TabList style={{ flexShrink: 0 }}>
                {this.visibleTabs.map(tab => (<Tab key={tab.name}>{tab.name}</Tab>))}
            </TabList>
        </Tabs>;
    }

    doRender(): React.ReactNode {
        return undefined;
    }

    private handleKeyPressed(e: React.KeyboardEvent) {
        if (this.visibleTabs.length === 0)
            return;

        if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            let nextTabIndex = this.selectedTabIndex + (e.key === "ArrowLeft" ? -1 : 1);
            if (nextTabIndex < 0)
                nextTabIndex = this.visibleTabs.length - 1;
            else if (nextTabIndex >= this.visibleTabs.length)
                nextTabIndex = 0;
            this.selectedTabIndex = nextTabIndex;
            e.preventDefault();
            this.onChangeEmitter.fire();
        }
    }

    private handleSelect(tabIndex: number) {
        this.selectedTabIndex = tabIndex;
        this.onChangeEmitter.fire();
    }

}
