import { Widget } from "@phosphor/widgets";
import { Emitter, Event } from "@theia/core";
import { injectable } from "inversify";
import * as React from "react";
import styled from "styled-components";
import messages from "martini-messages/lib/messages";

/**
 * Represents a page to be rendered in the PropertiesViewWidget.
 */
export interface PropertiesViewPage {
    onChange: Event<void>;
    /**
     * Whether or not the page should be scrolled vertically when the content overflows.
     */
    scrollY: boolean;

    /**
     * Called when the selection changed.
     * @param source the widget source of the selection
     * @param selection the current selection
     */
    onSelectionChange(source: Widget, selection: object | undefined): void;

    /**
     * Renders the page.
     */
    render(): React.ReactNode;
}

/**
 * Provides the page to be rendered for the current widget.
 */
export interface PropertiesViewPageProvider {
    getPropertiesViewPage(): PropertiesViewPage;
}

export namespace PropertiesViewPageProvider {
    export function is(object: any): object is PropertiesViewPageProvider {
        return !!object && "getPropertiesViewPage" in object;
    }
}

interface PageProps {
    scrollY: boolean;
}

const Page = styled.div<PageProps>`
    display: grid;
    grid-template-rows: max-content 1fr;
    grid-row-gap: 5px;
    height: 100%;
    overflow-y: ${ props => props.scrollY ? "auto" : undefined};

    .content {
        height: 100%;
        overflow-y: hidden;
    }
`;

const TitleBar = styled.div`
    display: grid;
    margin-left: 4px;
    grid-template-columns: max-content 1fr ${props => `repeat(${React.Children.count(props.children) - 2}, max-content)`};
    grid-column-gap: 4px;

    .label {
        align-self: center;
    }

    .read-only {
        display: grid;
        grid-template-columns: max-content max-content;

        div {
            align-self: center;
        }
    }
`;

/**
 * Base implementation of a PropertiesViewPage, it has a title with icon and a toolbar.
 */
@injectable()
export abstract class AbstractPropertiesViewPage implements PropertiesViewPage {
    protected readonly onChangeEmitter = new Emitter<void>();
    readonly onChange = this.onChangeEmitter.event;
    protected readOnly = false;
    title: string | undefined = undefined;
    iconClass: string | undefined = undefined;
    scrollY = true;

    abstract onSelectionChange(source: Widget, selection: object): void;

    render(): React.ReactNode {
        return <Page scrollY={this.scrollY}>
            {this.title &&
                <TitleBar>
                    <div className={`martini-tree-icon ${this.iconClass}`} />
                    <div className="label">{this.title}</div>
                    <div className="label read-only">{!this.readOnly ? "" :
                        (<>
                            <div className="martini-tree-icon martini-lock-icon"/>
                            <div>({messages.read_only})</div>
                        </>)}
                    </div>
                    {this.renderToolBar()}
                </TitleBar>
            }
            <div className="content">
                {this.doRender()}
            </div>
        </Page>;
    }

    protected abstract doRender(): React.ReactNode;

    protected renderToolBar(): React.ReactNode {
        return undefined;
    }
}
