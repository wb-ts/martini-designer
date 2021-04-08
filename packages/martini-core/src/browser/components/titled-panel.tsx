import { Panel } from "@theia/core/lib/browser";
import * as React from "react";
import * as ReactDOM from "react-dom";

export class TitledPanel extends Panel {
    private readonly titlePanel: Panel;

    constructor(
        private _title: string,
        private iconClass?: string
    ) {
        super();

        this.titlePanel = new Panel();
        this.addWidget(this.titlePanel);
        this.renderTitle();
    }

    setTitle(title: string, iconClass?: string) {
        this._title = title;
        this.iconClass = iconClass;
        this.renderTitle();
    }

    private renderTitle() {
        const titleDiv = (
            <div
                style={{
                    width: "100%",
                    textAlign: "center"
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {this.iconClass && <div className={"martini-tree-icon " + this.iconClass} />}
                    <div>{this._title}</div>
                </div>
            </div>
        );
        ReactDOM.render(titleDiv, this.titlePanel.node);
    }
}
