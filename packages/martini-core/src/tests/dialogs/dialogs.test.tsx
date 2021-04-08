import "reflect-metadata";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { BaseDialog } from "../../browser/dialogs/dialogs";

test("Dialog should be rendered", () => {
    const dlg = new TestDialog();
    const component = Renderer.create(dlg.render() as React.ReactElement);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

describe("When task is executed", () => {
    test("Dialog should render progress", () => {
        const dlg = new TestDialog();
        dlg.doShowProgress();
        const component = Renderer.create(dlg.render() as React.ReactElement);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("Dialog should render content", () => {
        const dlg = new TestDialog();
        const task = dlg.doShowProgress();
        task();
        const component = Renderer.create(dlg.render() as React.ReactElement);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});


class TestDialog extends BaseDialog<string> {

    constructor() {
        super({
            title: "Test Dialog"
        });
    }

    doShowProgress(): () => void {
        let task = () => { };
        const promise = new Promise(r => {
            task = () => r();
        });
        this.showProgress("Test...", progress => promise);
        return task;
    }

    render(): React.ReactNode {
        return super.render();
    }

    protected doRender(): React.ReactNode {
        return <div>Test</div>;
    }

    get value(): string {
        return "test";
    }

}
