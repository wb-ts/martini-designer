import * as React from "react";
import * as Phosphor from "@phosphor/widgets";
import { ReactWidget } from "@theia/core/lib/browser";
import { isEqual } from "lodash";
import { Emitter } from "@theia/core";

export interface WidgetProps {
    widget: () => Phosphor.Widget;
    onBeforeAttach?: () => void;
    style?: React.CSSProperties;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export class Widget extends React.Component<WidgetProps> {
    private readonly containerRef: React.RefObject<HTMLDivElement>;
    private widget: Phosphor.Widget;

    constructor(props: WidgetProps) {
        super(props);
        this.containerRef = React.createRef();
    }

    componentDidMount(): void {
        if (this.containerRef.current) {
            this.widget = this.props.widget();
            if (this.props.onBeforeAttach)
                this.props.onBeforeAttach();
            Phosphor.Widget.attach(this.widget, this.containerRef.current);
        }
    }

    componentWillUnmount(): void {
        if (!this.widget?.disposed)
            this.widget?.dispose();
    }

    componentDidUpdate(prevProps: Readonly<WidgetProps>, prevState: Readonly<{}>, snapshot?: any): void {
        this.widget?.update();
    }

    render(): React.ReactNode {
        return <div style={this.props.style} ref={this.containerRef} {...this.props.containerProps} />;
    }

}

export type WidgetFactory = () => Phosphor.Widget | Promise<Phosphor.Widget>;

export interface SplitPanelProps {
    orientation?: "vertical" | "horizontal";
    sizes?: number[];
    visibilities?: boolean[];
    style?: React.CSSProperties;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
    splitChildren: (React.ReactNode | WidgetFactory)[];
    onRelativeSizesChange?: (relativeSizes: number[]) => void;
}

export class SplitPanel extends React.Component<SplitPanelProps> {
    private splitPanel: CustomSplitPanel;

    render(): React.ReactNode {
        return <Widget
            style={{ height: "100%" }}
            widget={() => this.createSplitPanel()}
            onBeforeAttach={() => this.beforeAttach()}
            containerProps={this.props.containerProps}
        />;
    }

    protected beforeAttach() {
        this.props.splitChildren.forEach((child, i) => this.addChild(child, i));
        this.updateSizes();
    }

    componentDidUpdate(prevProps: Readonly<SplitPanelProps>, prevState: Readonly<{}>, snapshot?: any): void {
        const widgets = this.splitPanel.widgets;
        if (this.props.visibilities && !isEqual(prevProps.visibilities, this.props.visibilities))
            this.updateVisibilities();
        this.updateSizes();
        if (this.props.orientation !== prevProps.orientation && this.props.orientation)
            this.splitPanel.orientation = this.props.orientation;
        widgets.forEach(widget => widget.update());
        this.splitPanel.update();
    }

    componentWillUnmount(): void {
        if (!this.splitPanel.disposed)
            this.splitPanel.dispose();
    }

    private createSplitPanel(): Phosphor.SplitPanel {
        this.splitPanel = new CustomSplitPanel();
        this.splitPanel.addClass("full-height");
        const style = this.props.style;
        if (style) {
            Object.keys(style).forEach((key: string) => {
                // @ts-ignore
                this.splitPanel.node.style[key] = style[key];
            });
        }
        this.splitPanel.orientation = this.props.orientation || "horizontal";
        this.updateSizes();
        this.splitPanel.onRelativeSizesChange(relativeSizes => {
            if (this.props.onRelativeSizesChange)
                this.props.onRelativeSizesChange(relativeSizes);
        });
        return this.splitPanel;
    }

    private updateSizes() {
        if (this.props.sizes)
            this.splitPanel.setRelativeSizes(this.props.sizes);
    }

    private updateVisibilities() {
        if (this.props.visibilities) {
            const widgets = this.splitPanel.widgets;
            this.props.visibilities.forEach((visible, i) => {
                if(i >= widgets.length)
                    return;
                if (this.props.visibilities![i]) {
                    if (widgets[i].isHidden)
                        widgets[i].show();
                } else if (widgets[i].isVisible)
                    widgets[i].hide();
            });
        }
    }

    private addChild(
        child: React.ReactNode | WidgetFactory | Phosphor.Widget | Promise<Phosphor.Widget>,
        index: number) {
        if (typeof child === "function")
            this.addChild(child(), index);
        else if (child instanceof Phosphor.Widget)
            this.splitPanel.insertWidget(index, child);
        else if (child instanceof Promise) {
            child.then((widget: Phosphor.Widget) => this.addChild(widget, index));
        } else {
            const panel = new ReactPanel(() => this.props.splitChildren[index]);
            panel.addClass("full-height");
            this.splitPanel.insertWidget(index, panel);
        }

        this.updateVisibilities();
        this.updateSizes();
    }

}

class ReactPanel extends ReactWidget {

    constructor(readonly reactNode: () => React.ReactNode) {
        super();
    }

    protected onUpdateRequest(msg: any): void {
        super.onUpdateRequest(msg);
    }

    protected render(): React.ReactNode {
        return this.reactNode();
    }

    protected onResize(msg: Phosphor.Widget.ResizeMessage): void {
        super.onResize(msg);
        this.update();
    }
}

class CustomSplitPanel extends Phosphor.SplitPanel {

    private readonly onRelativeSizesChangeEmitter = new Emitter<number[]>();
    readonly onRelativeSizesChange = this.onRelativeSizesChangeEmitter.event;

    handleEvent(e: Event) {
        super.handleEvent(e);

        if (e.type === "mousemove")
            this.onRelativeSizesChangeEmitter.fire(this.relativeSizes());
    }

}
