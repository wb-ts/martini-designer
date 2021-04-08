require("reflect-metadata");
import { Widget } from "@theia/core/lib/browser";
import { Container } from "inversify";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { AbstractPropertiesViewPage } from "../../browser/properties-view/properties-view-page";
import { PropertiesViewTab } from "../../browser/properties-view/properties-view-tab";
import { TabbedPropertiesViewPage } from "../../browser/properties-view/tabbed-properties-view-page";

class DummyTab extends AbstractPropertiesViewPage implements PropertiesViewTab {
    name = "Dummy";
    order = 0;
    visible = true;

    protected doRender(): React.ReactNode {
        return <div>{this.name}</div>;
    }

    isVisible(selection: object): boolean {
        return this.visible;
    }

    onSelectionChange(selection: object) {
        // no-op
    }
}

const tab1 = new DummyTab();
tab1.name = "Tab 1";
tab1.order = 0;
const tab2 = new DummyTab();
tab1.name = "Tab 2";
tab1.order = 1;

const container = new Container();
container.bind(PropertiesViewTab).toConstantValue(tab1);
container.bind(PropertiesViewTab).toConstantValue(tab2);
container.bind(TabbedPropertiesViewPage).toSelf();

test("Should render visible tabs in the right other", () => {
    tab1.visible = true;
    tab2.visible = true;
    const page = container.get(TabbedPropertiesViewPage);
    page.onSelectionChange(new Widget(), {});
    const component = Renderer.create(page.render() as React.ReactElement);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Should not render not visible tabs", () => {
    tab1.visible = false;
    tab2.visible = true;
    const page = container.get(TabbedPropertiesViewPage);
    page.onSelectionChange(new Widget(), {});
    const component = Renderer.create(page.render() as React.ReactElement);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Should default to first tab if current tab index does not exist", () => {
    tab1.visible = true;
    tab2.visible = false;

    const page = container.get(TabbedPropertiesViewPage);
    Object.assign(page, { selectedTabIndex: 1 });
    page.onSelectionChange(new Widget(), {});

    const component = Renderer.create(page.render() as React.ReactElement);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
